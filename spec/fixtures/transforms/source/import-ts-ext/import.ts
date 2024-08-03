async function main() {
	const {foo} = await import('./bar.ts');
	console.log(foo);
}
main().catch(err => {
	console.error(err);
	process.exitCode = 1;
});
