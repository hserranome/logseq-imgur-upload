import "@logseq/libs";

const uploadToImgur = async (formData) => {
	// formData.append('album', 'EVGILvAjGfArJFI');
	return fetch("https://api.imgur.com/3/image", {
		method: "POST",
		headers: new Headers({
			Authorization: "Client-ID 90ef1830bd083ba",
		}),
		body: formData,
	});
};

const createDomElements = (container) => {
	// Create HTML form
	const form = document.createElement("form");
	form.classList.add("imgur-upload-form");
	form.innerHTML = `
				<input class="imgur-upload-input" name="image" type="file" id="imgur-upload-input" placeholder="Upload to Imgur" />
				<button class="imgur-upload-button" id="imgur-upload-button" type="submit">Upload</button>
			`;
	container.appendChild(form);
};

const handleEscPress = (e) => {
	if (e.key === "Escape") {
		logseq.hideMainUI({ restoreEditingCursor: true });
	}
	e.stopPropagation();
};

const handleClickOutside = (e) => {
	if (!(e.target as HTMLElement).closest(".imgur-upload-wrapper")) {
		logseq.hideMainUI({ restoreEditingCursor: true });
	}
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

		document.addEventListener("keydown", handleEscPress, false);
		document.addEventListener("click", handleClickOutside);

		// Handle submit event
		form.addEventListener("submit", (event: Event) => {
			event.preventDefault();
			// Get file into formdata and upload to Imgur
			const imageFile = (<HTMLInputElement>fileInput).files[0];
			const formData = new FormData();
			formData.append("image", imageFile);
			postData(formData);
		});

		async function postData(formdata) {
			try {
				submitButton.disabled = true;
				submitButton.innerText = "Uploading...";
				submitButton.classList.add("imgur-upload-button-disabled");
				const result = await uploadToImgur(formdata);
				if (result.ok) {
					const json = await result.json();
					const imgUrl = json.data.link;
					insertResult(imgUrl);
				}
			} catch (err) {
				console.log(err);
			}
			submitButton.disabled = false;
			submitButton.innerText = "Upload";
			submitButton.classList.remove("imgur-upload-button-disabled");
		}

		const insertResult = (imgUrl) => {
			logseq.Editor.insertAtEditingCursor(`![${imgUrl}](${imgUrl})`);
			logseq.Editor.exitEditingMode();
			logseq.hideMainUI();
			(<HTMLInputElement>document.querySelector("#imgur-upload-input")).value = "";
		};
	};

	// Register the slash command
	logseq.Editor.registerSlashCommand("Imgur", async () => {
		const { left, top, rect } = await logseq.Editor.getEditingCursorPosition();
		Object.assign(container.style, {
			top: top + rect.top + "px",
			left: left + rect.left + "px",
		});
		logseq.showMainUI();
		setTimeout(() => initImgurUpload(), 100);
	});
}

// Bootstrap the main function
logseq.ready(main).catch(console.error);
