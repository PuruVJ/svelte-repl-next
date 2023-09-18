import { get, readonly, writable } from 'svelte/store';
import { files_to_tree } from './files';
import { create_webcontainer_utils } from './webcontainer';

/**
 * @typedef {{ iframe_url: string | null; iframe_htmldoc: string | null; }} Store
 */

export class Adapter {
	/**
	 * @type {ReturnType<typeof create_webcontainer_utils> | null}
	 * @private
	 */
	_webcontainer = null;

	/**
	 * @type {import('./types').File[]}
	 * @private
	 */
	_files = [];

	/**
	 * @type {'rollup' | 'webcontainer'}
	 * @private
	 */
	_mode = 'rollup';

	/**
	 * @type {import('svelte/store').Writable<{ iframe_url: string | null; iframe_htmldoc: string | null;  }>}
	 * @private
	 */
	_store = writable({ iframe_htmldoc: null, iframe_url: null });

	_unsubscribe = () => {};

	/** @param {Partial<Store>} state */
	_merge_store_state(state) {
		const previous_state = get(this._store);

		this._store.set({ ...previous_state, ...state });
	}

	/** @param {import('@webcontainer/api').WebContainer} webcontainer  */
	set_webcontainer(webcontainer) {
		this._instance = webcontainer;

		this._webcontainer = create_webcontainer_utils({
			webcontainer,
			files: files_to_tree(this._files),
		});

		this._unsubscribe = this._webcontainer.subscribe((val) => {
			this._merge_store_state({
				iframe_url: val.webcontainer_url,
			});
		});
	}

	/** @param {import('./types').File[]} files  */
	set_files(files) {
		this._files = files;
	}

	/** @param {'rollup' | 'webcontainer'} mode */
	set_mode(mode) {
		this._mode = mode;
	}

	get unsafe_webcontainer() {
		return this._webcontainer;
	}

	get store() {
		return readonly(this._store);
	}

	listen() {
		if (this._webcontainer) {
			this._webcontainer.listen();
		}
	}

	/** @param {import('./types').File[]} files  */
	async mount(files) {
		this.set_files(files);

		if (this._webcontainer) {
			await this._webcontainer.mount(files_to_tree(files));
		}
	}

	async install_dependencies() {
		if (this._webcontainer) {
			await this._webcontainer.install_dependencies();
		}
	}

	async start_dev_server() {
		if (this._webcontainer) {
			await this._webcontainer.run_dev_server();
		}
	}

	async init() {
		if (this._webcontainer) {
			await this.mount(this._files);
			this.listen();
			await this.install_dependencies();
			await this.start_dev_server();
		}
	}

	/**
	 * @param {string} path
	 * @param {string} content
	 */
	async write_file(path, content) {
		if (this._webcontainer) {
			await this._webcontainer.write_file(path, content);
		}
	}
}
