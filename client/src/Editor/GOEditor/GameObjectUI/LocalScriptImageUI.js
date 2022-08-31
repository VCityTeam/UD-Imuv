import File from 'ud-viz/src/Components/SystemUtils/File';

export class LocalScriptImageUI {
  constructor(go, content, gV) {
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';

    const conf = go.components.LocalScript.conf;

    imageInput.onchange = function(e) {
      File.readSingleFileAsDataUrl(e, function(data) {
        const url = data.target.result;
        conf.path = url;
        go.setOutdated(true);
        gV.forceUpdate();
      });
    };

    const buttonDescription = document.createElement('button');
    buttonDescription.innerHTML = 'Change Description';
    buttonDescription.onclick = function() {
      const modal = document.createElement('div');
      modal.classList.add('modal');

      const modalContent = document.createElement('div');
      modalContent.classList.add('modal_content');
      modal.appendChild(modalContent);

      const inputTextDescription = document.createElement('textarea');
      inputTextDescription.classList.add('input_description');
      inputTextDescription.innerHTML = conf.descriptionText || '';

      modalContent.appendChild(inputTextDescription);

      const validateButton = document.createElement('button');
      validateButton.innerHTML = 'Validate';
      validateButton.onclick = function() {
        const value = inputTextDescription.value;
        const newValue = value != '' ? value : null;
        conf.descriptionText = newValue;
        modal.remove();
      };
      modalContent.appendChild(validateButton);

      const cancelButton = document.createElement('button');
      cancelButton.innerHTML = 'Cancel';
      cancelButton.onclick = function() {
        modal.remove();
      };
      modalContent.appendChild(cancelButton);

      content.appendChild(modal);
    };

    const divGPSCoord = document.createElement('div');

    const initGPSCoordHTMLElements = function() {
      const inputLat = document.createElement('input');
      inputLat.type = 'number';
      inputLat.step = 0.001;
      inputLat.value = conf.gpsCoord.lat || 0;
      divGPSCoord.appendChild(inputLat);

      const labelLat = document.createElement('label');
      labelLat.innerHTML = 'Lat';
      divGPSCoord.appendChild(labelLat);

      const inputLng = document.createElement('input');
      inputLng.type = 'number';
      inputLng.step = 0.001;
      inputLng.value = conf.gpsCoord.lng || 0;
      divGPSCoord.appendChild(inputLng);

      const labelLng = document.createElement('label');
      labelLng.innerHTML = 'Lng';
      divGPSCoord.appendChild(labelLng);

      inputLat.onchange = function() {
        const value = parseFloat(inputLat.value);
        conf.gpsCoord.lat = value;
      };

      inputLng.onchange = function() {
        const value = parseFloat(inputLng.value);
        conf.gpsCoord.lng = value;
      };

      const choseOnMapButton = document.createElement('button');
      choseOnMapButton.innerHTML = 'Chose on map';
      divGPSCoord.appendChild(choseOnMapButton);
      choseOnMapButton.onclick = function() {
        const modal = document.createElement('div');
        modal.classList.add('modal');

        const modalContent = document.createElement('div');
        modalContent.classList.add('modal_content');
        modal.appendChild(modalContent);

        const coordinatesText = document.createElement('p');

        const img = document.createElement('img');
        img.src = conf.map_path;
        img.style.width = '40%';

        const validateButton = document.createElement('button');
        validateButton.innerHTML = 'Validate';
        const cancelButton = document.createElement('button');
        cancelButton.innerHTML = 'Cancel';
        modalContent.appendChild(coordinatesText);
        modalContent.appendChild(img);
        modalContent.appendChild(validateButton);
        modalContent.appendChild(cancelButton);

        img.onload = function() {
          const imgDrawed = document.createElement('img');
          imgDrawed.src = conf.map_path;
          img.onclick = function(event) {
            const x = event.pageX;
            const y = event.pageY;
            const rect = this.getBoundingClientRect();
            const ratioX = (x - rect.left) / (rect.right - rect.left);
            const ratioY = 1 - (y - rect.top) / (rect.bottom - rect.top);
            const coords = go
              .fetchLocalScripts()
              ['image'].ratioToCoordinates(ratioX, ratioY);
            coordinatesText.innerHTML =
              'Coordinates selected \nLat: ' +
              coords.lat +
              ' Lng: ' +
              coords.lng;

            const canvas = go
              .fetchLocalScripts()
              ['image'].createCanvasDrawed(imgDrawed, ratioX, 1 - ratioY);

            this.src = canvas.toDataURL();

            validateButton.onclick = function() {
              if (coords.lat) {
                inputLat.value = coords.lat;
                inputLat.dispatchEvent(new Event('change'));
              }
              if (coords.lng) {
                inputLng.value = coords.lng;
                inputLng.dispatchEvent(new Event('change'));
              }
              modal.remove();
            };
          };
        };

        cancelButton.onclick = function() {
          modal.remove();
        };
        content.appendChild(modal);
      };
    };

    const divCheckboxLabelGPSCoord = document.createElement('div');

    const checkboxGPSCoord = document.createElement('input');
    checkboxGPSCoord.id = 'checkbox_gpscoord';
    checkboxGPSCoord.type = 'checkbox';
    checkboxGPSCoord.onchange = function(event) {
      const value = event.target.checked;
      conf.gpsCoord.checked = value;
      if (value) {
        initGPSCoordHTMLElements();
      } else {
        divGPSCoord.innerHTML = '';
        conf.gpsCoord.lat = null;
        conf.gpsCoord.lng = null;
      }
    };
    checkboxGPSCoord.checked = conf.gpsCoord.checked || false;
    checkboxGPSCoord.dispatchEvent(new Event('change'));
    divCheckboxLabelGPSCoord.appendChild(checkboxGPSCoord);

    const labelGPSCoord = document.createElement('label');
    labelGPSCoord.innerHTML = 'GPSCoord';
    labelGPSCoord.htmlFor = checkboxGPSCoord.id;
    divCheckboxLabelGPSCoord.appendChild(labelGPSCoord);

    const inputFactorHeight = document.createElement('input');
    inputFactorHeight.type = 'number';
    inputFactorHeight.step = 0.1;
    inputFactorHeight.value = conf.factorHeight || 1;
    divGPSCoord.appendChild(inputFactorHeight);
    inputFactorHeight.onchange = function(event) {
      conf.factorHeight = event.target.value;
    };

    const labelFactorHeight = document.createElement('label');
    labelFactorHeight.innerHTML = 'Factor Height';
    divGPSCoord.appendChild(labelFactorHeight);

    const inputFactorWidth = document.createElement('input');
    inputFactorWidth.type = 'number';
    inputFactorWidth.step = 0.1;
    inputFactorWidth.value = conf.factorWidth || 1;
    divGPSCoord.appendChild(inputFactorWidth);
    inputFactorWidth.onchange = function(event) {
      conf.factorWidth = event.target.value;
    };

    const labelFactorWidth = document.createElement('label');
    labelFactorWidth.innerHTML = 'Factor Width';
    divGPSCoord.appendChild(labelFactorWidth);

    const refresh = document.createElement('button');
    refresh.innerHTML = 'Refresh';
    divGPSCoord.appendChild(refresh);
    refresh.onclick = function() {
      go.setOutdated(true);
      gV.forceUpdate();
    };

    content.appendChild(imageInput);
    content.appendChild(buttonDescription);
    content.appendChild(divCheckboxLabelGPSCoord);
    content.appendChild(divGPSCoord);

    content.appendChild(inputFactorHeight);
    content.appendChild(labelFactorHeight);
    content.appendChild(inputFactorWidth);
    content.appendChild(labelFactorWidth);

    content.appendChild(refresh);
  }
}
