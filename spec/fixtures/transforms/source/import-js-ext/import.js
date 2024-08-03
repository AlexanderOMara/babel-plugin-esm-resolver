async function main() {
	const {foo} = await import('./bar.js');
	console.log(foo);
}
main().catch(err => {
	console.error(err);
	process.exitCode = 1;
});
