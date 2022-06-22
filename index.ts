import "@logseq/libs";

const uploadToImgur = async (formData) => {
	// formData.append('album', 'EVGILvAjGfArJFI');
	return fetch("https://api.imgur.com/3/image", {
		method: "POST",
		headers: new Headers({
			Authorization: "Client-ID f3ce1ca4ab789d4",
		}),
		body: formData,
	});
};

const createDomElements = (container) => {
	// Create HTML form
	const form = document.createElement("form");
	form.classList.add("imgur-upload-form");
	form.innerHTML = `
		<input class="imgur-upload-input" name="image" type="file" id="imgur-upload-input" />
		<button class="imgur-upload-button" id="imgur-upload-button" type="submit">Upload</button>
		<div class="imgur-upload-message" id="imgur-upload-message"></div>
	`;
	container.appendChild(form);
};

const handleClose = (e) => {
	if (
		(e.type === "keydown" && e.key === "Escape") ||
		(e.type === "click" && !(e.target as HTMLElement).closest(".imgur-upload-wrapper"))
	) {
		logseq.hideMainUI({ restoreEditingCursor: true });
	}
	e.stopPropagation();
};

const insertResultInCurrentBlock = async (imgUrl) => {
	const block = await logseq.Editor.getCurrentBlock();
	if (block.format === "org") {
		logseq.Editor.insertAtEditingCursor(`[[${imgUrl}][${imgUrl}]]`);
	} else {
		logseq.Editor.insertAtEditingCursor(`![${imgUrl}](${imgUrl})`);
	}
	logseq.Editor.exitEditingMode();
	logseq.hideMainUI();
	(<HTMLInputElement>document.querySelector("#imgur-upload-input")).value = "";
};

async function postData(formdata, button) {
	try {
		button.disabled = true;
		button.innerText = "Uploading...";
		button.classList.add("imgur-upload-button-disabled");
		const result = await uploadToImgur(formdata);
		if (result.ok) {
			const json = await result.json();
			const imgUrl = json.data.link;

			await insertResultInCurrentBlock(imgUrl);
		}
	} catch (err) {
		console.log(err);
	}
	button.disabled = false;
	button.innerText = "Upload";
	button.classList.remove("imgur-upload-button-disabled");
}

const checkFileIsValid = (file) => {
	if (!file.type || !file.type.match(/image.*/)) return "File is not an image";
	if (file.size > 20 * 1024 * 1024) return "File is too large"; // 20MB
	return true;
};

const generateFormData = (file) => {
	const formData = new FormData();
	formData.append("image", file);
	return formData;
};

async function main() {
	let elementsCreated = false;
	const container = document.createElement("div");
	document.getElementById("app").appendChild(container);
	container.classList.add("imgur-upload-wrapper");

	const initImgurUpload = () => {
		if (!elementsCreated) {
			createDomElements(container);
			elementsCreated = true;
		}
		const form = document.querySelector(".imgur-upload-form");
		const fileInput = document.querySelector("#imgur-upload-input");
		const submitButton = <HTMLInputElement>document.querySelector("#imgur-upload-button");
		const message = <HTMLInputElement>document.querySelector("#imgur-upload-message");

		document.addEventListener("keydown", handleClose, false);
		document.addEventListener("click", handleClose);

		const handleUpload = async (files) => {
			if (files.length === 0) return;
			message.innerText = "";
			// We only support one file at a time
			const file = files[0];
			const error = checkFileIsValid(file);
			if (typeof error === "string") {
				message.innerText = error;
				return;
			}
			const formData = generateFormData(file);
			await postData(formData, submitButton);
		};

		form.addEventListener("submit", (event: Event) => {
			event.preventDefault();
			handleUpload((<HTMLInputElement>fileInput).files);
		});

		document.onpaste = (event) => {
			const clipboardData = event.clipboardData || (window as any).clipboardData;
			handleUpload(clipboardData.files);
		};
	};

	// Register the slash command
	logseq.Editor.registerSlashCommand("Imgur", async () => {
		const { left, top, rect } = await logseq.Editor.getEditingCursorPosition();
		Object.assign(container.style, { top: top + rect.top + "px", left: left + rect.left + "px" });
		logseq.showMainUI();
		setTimeout(() => initImgurUpload(), 100);
	});
}

// Bootstrap the main function
logseq.ready(main).catch(console.error);
