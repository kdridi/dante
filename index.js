const ProgressBar = require('progress')
const API = require('./data/api')

const main = async (api) => {
	const requests = await api.getRepositoryList()
	console.log(requests)

	const bar = new ProgressBar('downloading [:bar] :percent :etas :current/:total  ', { total: requests.length })

	const responses = await Promise.all(
		requests.map(async (request) => {
			const { wdir, deliveryURL, testsURL } = request

			{
				api.gitClone(wdir, testsURL, 'tests')
				api.dockerRun(wdir, 'make', '-C', 'tests')
			}

			const clone = api.gitClone(wdir, deliveryURL, 'delivery')
			const build = api.dockerRun(wdir, 'make', '-C', 'delivery')

			const steps = { clone, build }
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
