export const handle = ({ event, resolve }) => {
	event.setHeaders({
		'Cross-Origin-Embedder-Policy': 'credentialless',
		'Cross-Origin-Opener-Policy': 'same-origin',
	});

	return resolve(event);
};
