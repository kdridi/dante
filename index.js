const execa = require('execa')
const path = require('path')
const API = require('./data/api')

const main = async (api) => {
	const requests = await api.getRepositoryList()
	const responses = []

	for (let index = 0; index < requests.length; index++) {
		const request = requests[index]

		console.error(request)
		const { url, wdir, tdir } = request

		{
			await execa('git', ['clone', tdir, path.resolve(wdir, 'tests')])
			await execa('docker', ['container', 'run', '--rm', '--network', 'none', '-v', `${wdir}:/app`, '-w', '/app', 'epitechcontent/epitest-docker', 'bash', '-c', 'make -C tests'])
		}

		let clone = null
		{
			try {
				clone = await execa('git', ['clone', url, path.resolve(wdir, 'delivery')])
			} catch (error) {
				clone = error
			}
		}

		let build = null
		{
			try {
				build = await execa('docker', ['container', 'run', '--rm', '--network', 'none', '-v', `${wdir}:/app`, '-w', '/app', 'epitechcontent/epitest-docker', 'bash', '-c', 'make -C delivery'])
			} catch (error) {
				build = error
			}
		}

		const steps = { clone, build }
		console.error(request, steps)

		responses.push(Object.assign({ steps }, request))
	}

	return JSON.stringify(responses, null, 2)
}

main(new API('dante')).then(
	(res) => console.log(res),
	(err) => console.error(err)
)
