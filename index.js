const API = require('./data/api')

const main = async (api) => {
	const { students, slug, workdir } = api
	const repositoryList = students.map((student) => api.getRepository(student))
	return JSON.stringify({ students, slug, workdir, repositoryList }, null, 2)
}

main(new API('dante')).then(
	(res) => console.log(res),
	(err) => console.error(err)
)
