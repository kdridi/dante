const API = require('./data/api')

const main = async (api) => {
	const requests = await api.getRepositoryList()
	console.log(requests)

	const responses = []
	for (let requestIndex = 0; requestIndex < requests.length; requestIndex++) {
		const request = requests[requestIndex]
		console.log(`>>>> request[${requestIndex + 1}/${requests.length}] : `, request)

		const { wdir, deliveryURL, testsURL, artifacts } = request

		const tests = { clone: null, make: null }
		tests.clone = await api.gitClone(wdir, testsURL, 'tests')
		tests.make = await api.dockerRun(wdir, 'make', '-C', 'tests')

		const delivery = { clone: null, make: null }
		delivery.clone = await api.gitClone(wdir, deliveryURL, 'delivery')
		delivery.make = await api.dockerRun(wdir, 'make', '-C', 'delivery')

		const deploy = {}
		for (let artifactIndex = 0; artifactIndex < artifacts.length; artifactIndex++) {
			const artifact = artifacts[artifactIndex]

			const dirname = artifact.split('/')
			const basename = dirname.pop()

			const tpath = ['tests', ...dirname].join('/')
			const fpath = ['delivery', ...dirname, basename].join('/')

			const data = { mkdir: null, copy: null }
			data.mkdir = await api.dockerRun(wdir, 'mkdir', '-p', tpath)
			data.copy = await api.dockerRun(wdir, 'cp', fpath, tpath)

			deploy[artifact] = data
		}

		responses.push(
			Object.assign(request, {
				steps: {
					tests,
					delivery,
					deploy,
				},
			})
		)
	}

	return JSON.stringify(responses, null, 2)
}

main(new API('dante')).then(
	(res) => console.log(res),
	(err) => console.error(err)
)
