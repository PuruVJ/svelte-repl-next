import { get, writable } from 'svelte/store';
import { get_file_from_path } from './files';

/**
 * @typedef {{ webcontainer_url: string, iframe_path: string, status: 'booting' | 'ready' | 'waiting' | 'server_closed' }} WebContainerStoreType
 */

const decoder = new TextDecoder();

/**
 * @param {Object} param0
 * @param {import('@webcontainer/api').WebContainer | null} param0.webcontainer
 * @param {import('@webcontainer/api').FileSystemTree} param0.files
 */
export function create_webcontainer_utils({ webcontainer, files }) {
	/** @type {import('svelte/store').Writable<WebContainerStoreType>} */
	const { subscribe, set } = writable({
		webcontainer_url: '',
		iframe_path: '/',
		status: 'booting',
		// process_writer: null as WritableStreamDefaultWriter<string> | null,
		// running_process: null as WebContainerProcess | null,
		// is_jsh_listening: false,
	});

	/** @param {Partial<WebContainerStoreType>} state  */
	async function merge_state(state) {
		const previous_state = get({ subscribe });

		set({
			...previous_state,
			...state,
		});
	}

	return {
		subscribe,

		/**
		 * Listen to the webcontainer, and run any processes that are queued.
		 */
		async listen() {
			if (!webcontainer) return;

			webcontainer.on('server-ready', (port, url) => {
				merge_state({
					webcontainer_url: url,
					status: 'ready',
				});

				webcontainer.on('port', (closed_port) => {
					if (port === closed_port) {
						merge_state({ webcontainer_url: '', status: 'server_closed' });
					}
				});
			});
		},

		/**
		 * @param {string} path
		 * @param {boolean} as_string
		 * @returns {Promise<string | undefined>}
		 */
		async read_file(path, as_string = true) {
			if (!webcontainer) return;

			try {
				if (as_string) {
					return webcontainer.fs.readFile(path, 'utf8');
				}
				return webcontainer.fs.readFile(path, 'utf8');
			} catch (e) {
				// use store instead
				let contents = get_file_from_path(path, files)?.contents;
				if (typeof contents !== 'string') {
					contents = decoder.decode(contents);
				}
				return contents;
			}
		},

		async read_package_json() {
			try {
				const file = await this.read_file('./package.json');
				if (!file) return {};

				return JSON.parse(file);
			} catch (e) {
				return {};
			}
		},

		async install_dependencies() {
			if (!webcontainer) return;

			const package_json = await this.read_package_json();
			// if there are no dependencies to install just return 0 as the
			// correct exit code
			if (!(package_json?.dependencies || package_json?.devDependencies)) {
				// listen_for_files_changes();
				return Promise.resolve(0);
			}

			const install_process = await webcontainer.spawn('pnpm', ['install'], { output: true });

			install_process.output.pipeTo(
				new WritableStream({
					write: (chunk) => {
						console.log(chunk);
					},
				})
			);

			await install_process.exit;
		},

		async run_dev_server() {
			if (!webcontainer) return;

			// const package_json = await this.read_package_json();
			// if there is no dev script just return 0 as the
			// correct exit code
			// if (!package_json?.scripts?.dev) {
			// 	terminal.write('no dev script found, run whatever you want...\n');
			// 	return 0;
			// }

			const dev_server_process = await webcontainer.spawn('npm', ['run', 'dev'], { output: true });

			dev_server_process.output.pipeTo(
				new WritableStream({
					write: (chunk) => {
						console.log(chunk);
					},
				})
			);

			await dev_server_process.exit;
		},
	};
}
