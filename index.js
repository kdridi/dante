const ProgressBar = require('progress')
const API = require('./data/api')

const main = async (api) => {
	const requests = await api.getRepositoryList()
	console.log(requests)

	const bar = new ProgressBar('downloading [:bar] :percent :etas :current/:total  ', { total: requests.length })

	const responses = await Promise.all(
		requests.map(async (request) => {
			const { wdir, deliveryURL, testsURL } = request

			const tests = { clone: null, make: null }
			tests.clone = await api.gitClone(wdir, testsURL, 'tests')
			tests.make = await api.dockerRun(wdir, 'make', '-C', 'tests')

			const delivery = { clone: null, make: null }
			delivery.clone = await api.gitClone(wdir, deliveryURL, 'delivery')
			delivery.make = await api.dockerRun(wdir, 'make', '-C', 'delivery')

			const steps = { tests, delivery }
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
