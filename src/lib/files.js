/** @param {import("./types").InputFile[]} files */
export function process_file_to_id(files) {
	return files.map((file) => ({
		...file,
		id: nanoid(),
	}));
}

function nanoid() {
	return Math.random().toString(36).substring(2, 15);
}

/**
 *
 * @param {import("@webcontainer/api").DirectoryNode | import("@webcontainer/api").FileNode} file
 * @returns {file is import("@webcontainer/api").DirectoryNode}
 */
function is_dir(file) {
	return 'directory' in file;
}

/** @param {import("./types").File[]} files */
export function files_to_tree(files) {
	/** @type {import('@webcontainer/api').FileSystemTree} */
	const result = {};

	files.forEach((file) => {
		// split the source string by "/"
		const paths = file.path.split('/');
		let currentDirectory = result;

		// iterate over the path
		for (let i = 0; i < paths.length; i++) {
			const path = paths[i];

			// if it's the last path, it's the file
			if (i === paths.length - 1) {
				currentDirectory[path] = {
					file: {
						contents: file.content, // file contents here, but we don't have it in the provided data structure
					},
				};
			} else {
				// if it's not the last path, it's a directory
				if (!currentDirectory[path]) {
					currentDirectory[path] = {
						directory: {},
					};
				}

				let current_dir_path = currentDirectory[path];
				if (is_dir(current_dir_path)) {
					// set the current directory to the next nested directory
					currentDirectory = current_dir_path.directory;
				}
			}
		}
	});

	return result;
}

/**
 *
 * @param {string} base_path
 * @param {import("@webcontainer/api").FileSystemTree} files
 * @param {boolean} create_if_not_exist
 */
export function get_file_from_path(base_path, files, create_if_not_exist = false) {
	const path = base_path.split(/\.?\//);
	let subtree = files;
	for (let index = 0; index < path.length; index++) {
		const path_part = path[index];
		if (path_part) {
			let file = subtree[path_part];
			if (!file && create_if_not_exist) {
				// if it's not the last part and it doesn't
				// exist we create a directory
				if (index !== path.length - 1) {
					subtree[path_part] = {
						directory: {},
					};
				} else {
					//this means is a new file
					subtree[path_part] = {
						file: {
							contents: '',
						},
					};
				}
				file = subtree[path_part];
			}
			if (!file) {
				throw new Error('File does not exist');
			}
			if (is_dir(file)) {
				subtree = file.directory;
			} else {
				return file.file;
			}
		}
	}
	throw new Error('You are trying to get the file content of a folder');
}
