const ProgressBar = require('progress')
const API = require('./data/api')

const main = async (api) => {
	const requests = await api.getRepositoryList()
	console.log(requests)

	const bar = new ProgressBar('downloading [:bar] :percent :etas :current/:total  ', { total: requests.length })

	const responses = await Promise.all(
		requests.map(async (request) => {
			const { wdir, deliveryURL, testsURL, artifacts } = request

			const tests = { clone: null, make: null }
			tests.clone = await api.gitClone(wdir, testsURL, 'tests')
			tests.make = await api.dockerRun(wdir, 'make', '-C', 'tests')

			const delivery = { clone: null, make: null }
			delivery.clone = await api.gitClone(wdir, deliveryURL, 'delivery')
			delivery.make = await api.dockerRun(wdir, 'make', '-C', 'delivery')

			const deploy = (
				await Promise.all(
					artifacts.map(async (artifact) => {
						const dirname = artifact.split('/')
						const basename = dirname.pop()

						const tpath = ['tests', ...dirname].join('/')
						const fpath = ['delivery', ...dirname, basename].join('/')

						const data = { mkdir: null, copy: null }
						data.mkdir = await api.dockerRun(wdir, 'mkdir', '-p', tpath)
						data.copy = await api.dockerRun(wdir, 'cp', fpath, tpath)

						return { artifact, data }
					})
				)
			).reduce((res, { artifact, data }) => Object.assign(res, { [artifact]: data }), {})

			const steps = { tests, delivery, deploy }
			bar.tick()

			return Object.assign(request, { steps })
		})
	)
	return JSON.stringify(responses, null, 2)
}

main(new API('dante')).then(
	(res) => console.log(res),
	(err) => console.error(err)
)
