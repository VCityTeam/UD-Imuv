export class WorldScriptTeleporterUI {
  constructor(goui, wS) {
    const teleporterInput = document.createElement('div');
    const refDestinationTransform = wS['teleporter'].conf.destinationTransform;
    if (!refDestinationTransform) throw new Error('no dest transform');

    const labelDesT = document.createElement('div');
    labelDesT.innerHTML = 'Teleporter destination transform';
    teleporterInput.appendChild(labelDesT);

    const labelPosition = document.createElement('div');
    labelPosition.innerHTML = 'position';
    labelPosition.appendChild(
      goui.createInputFromVector3(refDestinationTransform.position)
    );

    const labelRotation = document.createElement('div');
    labelRotation.innerHTML = 'rotation';
    labelRotation.appendChild(
      goui.createInputFromVector3(refDestinationTransform.rotation)
    );

    teleporterInput.appendChild(labelPosition);
    goui.content.appendChild(teleporterInput);
  }
}
