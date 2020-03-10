const API = require('./data/api')

const main = async (api) => {
	const result = await api.getRepositoryList()
	return JSON.stringify(result, null, 2)
}

main(new API('dante')).then(
	(res) => console.log(res),
	(err) => console.error(err)
)
