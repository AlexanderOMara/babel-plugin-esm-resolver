async function main() {
	const {foo} = await import('@-testing/module/lib/bar');
	console.log(foo);
}
main().catch(err => {
	console.error(err);
	process.exitCode = 1;
});
