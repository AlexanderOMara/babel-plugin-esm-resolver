async function main() {
	const {foo} = await import('https://example.com/main.js');
	console.log(foo);
}
main().catch(err => {
	console.error(err);
	process.exitCode = 1;
});
