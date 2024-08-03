async function main() {
	const bar = await import('./bar');
	console.log(bar);
}
main().catch(err => {
	console.error(err);
	process.exitCode = 1;
});
