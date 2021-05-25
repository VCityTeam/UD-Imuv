/** @format */

import { THREE } from 'ud-viz';


export class MeshEditorModel{
    constructor(gameObjectModel)
    {
        this.gameObjectModel = gameObjectModel;

        this.hiddenMeshes = [];
    }

    hideMesh(mesh)
    {

    }

    showMesh(mesh)
    {

    }

    init()
    {

    }

    getHiddenMeshes()
    {
      return this.hiddenMeshes;
    }


}