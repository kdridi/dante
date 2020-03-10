const API = require('./data/api')

const main = async (api) => {
	const { students, slug, workdir } = api
	return JSON.stringify({ students, slug, workdir }, null, 2)
}

main(new API('dante')).then(
	(res) => console.log(res),
	(err) => console.error(err)
)
