import fs from 'fs';
import shell from 'shelljs';
import path from 'path';
import FormData from 'form-data';
import { createTarBall, getFileHash } from '../utils/tar.js';
import api from '../utils/api.js';

const USE_PKGR = {
    YES: 'YES',
    NO: 'NO'
}


const DATA_SOURCE_TYPE = {
    STANDALONE: 'standalone',
    ELASTIC_SERVER: 'elasticserver'
}

function tarballFileFilter(filePath) {
    return !(/node_modules|pre_deploy_assets|__shared|__generated|\.git/.test(filePath))
}

const PackagesHelper = (props) => {
    const { SKED_ACCESS_TOKEN, packageGit, packageBranch } = props;

    const sourcePackage = path.join(process.cwd(), 'src/packages');
    const gitFolder = packageGit.toString().split('/')?.pop()?.replace('.git', '');
    const packagePath = path.join(sourcePackage, gitFolder);

    const bundlePackage = () => {
        const buildAssetsPath = path.join(packagePath, '/pre_deploy_assets')

        if (!fs.existsSync(buildAssetsPath)) {
            fs.mkdirSync(buildAssetsPath)
        }

        const targetPackageFile = path.join(buildAssetsPath, '/package.tar.gz')
        return createTarBall(packagePath, targetPackageFile, tarballFileFilter)
    }

    const getPackageUrlBasedOnFlag = (path, usePkgr = USE_PKGR.NO) => {
        return usePkgr === USE_PKGR.YES ? `/pkgr${path}?source=standalone` : `/pkg${path}`
    }

    const getBuildUrlBasedOnFlag = (path, usePkgr = 'NO') => {
        const sourceType = usePkgr === USE_PKGR.YES ? DATA_SOURCE_TYPE.STANDALONE : DATA_SOURCE_TYPE.ELASTIC_SERVER
        return `/pkgr${path}?source=${sourceType}`
    }

    const getProjectDataPath = () => {
        return path.join(packagePath, '/sked.pkg.json')
    }

    const getProjectData = () => {
        try {
            const projData = fs.readFileSync(getProjectDataPath(), 'utf8')
            return JSON.parse(projData)
        } catch (error) {
            console.error('Project file sked.pkg.json not found.')
            throw error
        }
    }

    const uploadPackage = async (bundlePath, pkg) => {
        const metadata = pkg

        const formData = new FormData();
        formData.append("name", pkg.name);
        formData.append("hash", getFileHash(bundlePath));
        formData.append("source", fs.createReadStream(bundlePath));
        formData.append("metadata", JSON.stringify(metadata));

        return api.post(
            getPackageUrlBasedOnFlag(`/source/${encodeURIComponent(metadata.name)}`, process.env.USE_PKGR),
            formData,
            {
                headers: {
                    Authorization: `Bearer ${SKED_ACCESS_TOKEN}`,
                    'Content-Type': 'multipart/form-data'
                },
            }
        )
            .then(res => res.data.result)
            .catch((error) => console.log(error.response.data))
    }

    const startBuild = async (name, hash) => {
        const response = await api.post(
            getBuildUrlBasedOnFlag(`/build`, process.env.USE_PKGR),
            {
                name, hash, action: 'deploy'
            },
            {
                headers: {
                    Authorization: `Bearer ${SKED_ACCESS_TOKEN}`
                },
            }
        )

        return response?.data
    }

    const installPackage = (packageId) => {
        return api.post(`/pkgr/build/install/${packageId}`, undefined, {
            headers: {
                Authorization: `Bearer ${SKED_ACCESS_TOKEN}`
            },
        })
    }

    const getPackages = async () => {
        const response = await api.get('/pkg/available', {
            headers: {
                Authorization: `Bearer ${SKED_ACCESS_TOKEN}`
            },
        })

        return response?.data;
    }

    const getBuildStatus = async (id) => {
        const response = await api.get(`pkg/builds/${id}`, {
            headers: {
                Authorization: `Bearer ${SKED_ACCESS_TOKEN}`
            },
        })

        return response?.data?.result
    }

    const deployPackage = async () => {
        const pkg = getProjectData()

        const bundlePath = await bundlePackage()

        if (bundlePath) {
            console.log(`${pkg.name} Bundle success!`)
        }

        const deployedPackage = await uploadPackage(bundlePath, pkg)

        const { name, hash } = deployedPackage
        if (name && hash) {
            console.log(`${name} Upload success!`)
        }

        const { result } = await startBuild(name, hash)

        if (!result) {
            throw new Error(`${name} build failed!`)
        }

        console.log(`${name} Start build success!`)

        const { id: buildId } = result
        // Check build status every 5 minutes maximum 3 times
        // Install if build status passed
        let checkTime = 0

        console.log(`${name} Checking build progress...`);

        return new Promise((resolve, reject) => {
            const installBuild = setInterval(async () => {
                checkTime++
                const { status } = await getBuildStatus(buildId)
                console.log(`Running interval check - ${name} build status is`, status)
                if (status === 'Passed') {
                    await installPackage(buildId)

                    console.log(`${name} Install success!`)

                    clearInterval(installBuild);

                    resolve(buildId);
                }

                if (checkTime === 3 || status === 'Failed') {
                    console.log(`${name} build failed!`)
                    clearInterval(installBuild)
                    throw new Error(`${name} build failed!`)
                }

            }, 1000 * 60)
        })
    }

    const deploy = async () => {
        console.log('>>>> Deploying packages');

        const result = {
            input: packagePath,
            success: null,
            error: null
        }

        try {
            if (!fs.existsSync(sourcePackage)){
                fs.mkdirSync(sourcePackage, { recursive: true });
            }

            shell.cd(sourcePackage);

            if (!fs.existsSync(packagePath)) {
                shell.exec(`git clone ${packageGit}`);
            }

            if (packageBranch) {
                shell.cd(gitFolder);
                shell.exec(`git checkout ${packageBranch}`);
            }

            const buildAssetsPath = path.join(packagePath, '/pre_deploy_assets')

            if (fs.existsSync(buildAssetsPath)) {
                shell.exec('rm -rf pre_deploy_assets');
            }

            result.success = await deployPackage();
        } catch (error) {
            result.error = error;

            if (error instanceof Error) {
                console.log(`There is an error!!! ${error.message}`)
            }
        }

        return result;
    }

    return {
        getName: () => 'Packages',
        deploy,
    }
}

export const createPackagesHelper = (props) => {
    return PackagesHelper(props)
}
