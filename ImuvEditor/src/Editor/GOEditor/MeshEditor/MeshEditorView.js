/** @format */

import { createTileGroupsFromBatchIDs } from 'ud-viz/src/Components/3DTiles/3DTilesUtils';
import { TemporalGraphWindow } from 'ud-viz/src/Widgets/Temporal/View/TemporalGraphWindow';
import { MeshEditorModel } from './MeshEditorModel';
import { THREE } from 'ud-viz';

export class MeshEditorView
{
    constructor(goView)
    {
        //parent
        this.goView = goView;

        //root UI
        this.rootHtml = document.createElement('div');
        this.rootHtml.classList.add('root_MeshEditorView');

        //MeshEditor Model
        if(!goView.model) throw new Error('no model');
        this.model = new MeshEditorModel(goView.model);

        //raycaster
        this.raycaster = new THREE.Raycaster();

        //html
        this.hiddenMeshesList = null;
        
        this.init();
    }

    html()
    {
        return this.rootHtml;
    }

    init()
    {
        this.model.init();

        this.initUI();

        this.initCallbacks();
    }
    
    initUI() 
    {
        //hidden meshes preview
        const labelHiddenMeshesList = document.createElement('div');
        labelHiddenMeshesList.innerHTML = 'Hidden Meshes';
        this.rootHtml.appendChild(labelHiddenMeshesList);
        const hiddenMeshesList = document.createElement('ul');
        this.rootHtml.appendChild(hiddenMeshesList);
        this.hiddenMeshesList = hiddenMeshesList;

        this.updateUI();
    }

    updateUI()
    {
        //update hidden meshes list
        const list = this.hiddenMeshesList;
        while(list.firstChild)
        {
            list.removeChild(list.firstChild);
        }

        this.model.getHiddenMeshes().forEach(function (mesh) {
            list.appendChild(this.meshHTML(mesh))
        });

    }

    dispose() 
    {
        this.rootHtml.parentElement.removeChild(this.rootHtml);
    }
    

    initCallbacks()
    {

    }
}