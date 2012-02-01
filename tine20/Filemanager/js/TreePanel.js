/*
 * Tine 2.0
 * 
 * @package     Tinebase
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2010 Metaways Infosystems GmbH (http://www.metaways.de)
 */

Ext.ns('Tine.Filemanager');

/**
 * @namespace Tine.Filemanager
 * @class Tine.Filemanager.TreePanel
 * @extends Tine.widgets.container.TreePanel
 * 
 * @author Martin Jatho <m.jatho@metaways.de>
 */


Tine.Filemanager.TreePanel = function(config) {
    Ext.apply(this, config);
    
    this.addEvents(
        /**
         * @event containeradd
         * Fires when a folder was added
         * @param {folder} the new folder
         */
        'containeradd',
        /**
         * @event containerdelete
         * Fires when a folder got deleted
         * @param {folder} the deleted folder
         */
        'containerdelete',
        /**
         * @event containerrename
         * Fires when a folder got renamed
         * @param {folder} the renamed folder
         */
        'containerrename'
    );
        
    Tine.Filemanager.TreePanel.superclass.constructor.call(this);
};

Ext.extend(Tine.Filemanager.TreePanel, Tine.widgets.container.TreePanel, {
    
    filterMode : 'filterToolbar',
    
    recordClass : Tine.Filemanager.Model.Node,
    
    allowMultiSelection : false, 
    
    defaultContainerPath: '/personal',
    
    ddGroup: 'fileDDGroup',
    
    enableDD: true,
       
    initComponent: function() {
        
        this.on('containeradd', this.onFolderAdd, this);
        this.on('containerrename', this.onFolderRename, this);
        this.on('containerdelete', this.onFolderDelete, this);
        this.on('nodedragover', this.onNodeDragOver, this);

        this.selModel = new Ext.ux.tree.FileTreeSelectionModel({});
                
        this.getSelectionModel().on('initDrag', this.onInitDrag, this);
        Tine.Tinebase.uploadManager.on('update', this.onUpdate);

        Tine.Filemanager.TreePanel.superclass.initComponent.call(this);

        // init drop zone
        this.dropConfig = {
            ddGroup: this.ddGroup || 'fileDDGroup',
            appendOnly: this.ddAppendOnly === true,
            /**
             * @todo check acl!
             */
            onNodeOver : function(n, dd, e, data) {

                var preventDrop = false,
                    selectionContainsFiles = false;
                
                if(dd.dragData.selections) {
                    for(var i=0; i<dd.dragData.selections.length; i++) {
                        if(n.node.id == dd.dragData.selections[i].id) {
                            preventDrop = true;
                        }
                        if(dd.dragData.selections[i].data.type == 'file') {
                            selectionContainsFiles = true;
                        }
                    }
                }
                else if(dd.dragData.node && dd.dragData.node.id == n.node.id) {
                    preventDrop = true;
                } 
                
                if(selectionContainsFiles && !n.node.attributes.account_grants) {
                    preventDrop = true;
                }
                
                if(n.node.isAncestor(dd.dragData.node)) {
                    preventDrop = true;
                }

                return n.node.attributes.nodeRecord.isCreateFolderAllowed() 
                            && (!dd.dragData.node || dd.dragData.node.attributes.nodeRecord.isDragable())
                            && !preventDrop ? 'x-dd-drop-ok' : false;
            },
            
            isValidDropPoint: function(n, op, dd, e){

                var preventDrop = false,
                selectionContainsFiles = false;

                if(dd.dragData.selections) {
                    for(var i=0; i<dd.dragData.selections.length; i++) {
                        if(n.node.id == dd.dragData.selections[i].id) {
                            preventDrop = true;
                        }
                        if(dd.dragData.selections[i].data.type == 'file') {
                            selectionContainsFiles = true;
                        }
                    }
                }
                else if(dd.dragData.node && dd.dragData.node.id == n.node.id) {
                    preventDrop = true;
                } 

                if(selectionContainsFiles && !n.node.attributes.account_grants) {
                    preventDrop = true;
                }
                
                if(n.node.isAncestor(dd.dragData.node)) {
                    preventDrop = true;
                }
                
                return n.node.attributes.nodeRecord.isCreateFolderAllowed()
                        && (!dd.dragData.node || dd.dragData.node.attributes.nodeRecord.isDragable())
                        && !preventDrop;
            },
            completeDrop: function(de) {
                var ns = de.dropNode, p = de.point, t = de.target;
                t.ui.endDrop();
                this.tree.fireEvent("nodedrop", de);
            }
        };
        
        this.plugins = this.plugins || [];
        this.plugins.push({
            ptype : 'ux.browseplugin',
            enableFileDialog: false,
            multiple : true,
            handler : this.dropIntoTree
        });
        

    },
    
    /**
     * Tine.widgets.tree.FilterPlugin
     * returns a filter plugin to be used in a grid
     */
    // Tine.widgets.tree.FilterPlugin
    // Tine.Filemanager.PathFilterPlugin
    getFilterPlugin: function() {
        if (!this.filterPlugin) {
            this.filterPlugin = new Tine.Filemanager.PathFilterPlugin({
                treePanel: this,
                field: 'path',
                nodeAttributeField: 'path'                
            });
        }
        
        return this.filterPlugin;
    },

    /**
     * returns the personal root path
     * @returns {String}
     */
    getRootPath: function() {
        return Tine.Tinebase.container.getMyFileNodePath();
    },
    
    /**
     * returns params for async request
     * 
     * @param {Ext.tree.TreeNode} node
     * @return {Object}
     */
    onBeforeLoad: function(node) {
        
        var path = node.attributes.path;
        var type = Tine.Tinebase.container.path2type(path);
        var owner = Tine.Tinebase.container.pathIsPersonalNode(path);
        var loginName = Tine.Tinebase.registry.get('currentAccount').accountLoginName;
        
        if (type === 'personal' && owner != loginName) {
            type = 'otherUsers';
        }
        
        var newPath = path;
        
        if (type === 'personal' && owner) {
            var pathParts = path.toString().split('/');
            newPath = '/' + pathParts[1] + '/' + loginName;
            if(pathParts[3]) {
                newPath += '/' + pathParts[3];
            } 
        }
                
        var params = {
            method: 'Filemanager.searchNodes',
            application: this.app.appName,
            owner: owner,
            filter: [
                     {field: 'path', operator:'equals', value: newPath},
                     {field: 'type', operator:'equals', value: 'folder'}
                     ],
            paging: {dir: 'ASC', limit: 50, sort: 'name', start: 0}         
        };
        
        return params;
    },    
    
    /**
     * adopt attr
     * 
     * @param {Object} attr
     */
    onBeforeCreateNode: function(attr) {

        if (attr.accountDisplayName) {
            attr.name = attr.accountDisplayName;
            attr.path = '/personal/' + attr.accountId;
            attr.id = attr.accountId;
        }
        
        if (!attr.name && attr.path) {
            attr.name = Tine.Tinebase.container.path2name(attr.path, this.containerName, this.containersName);
        }
        
        if(attr.path && !attr.created_by) {
            var matches = attr.path.match(/^\/personal\/{0,1}([0-9a-z_\-]*)\/{0,1}/i);
            if (matches) {
                if (matches[1] != Tine.Tinebase.registry.get('currentAccount').accountLoginName && matches[1].length > 0) {
                    attr.id = matches[1];
                } 
                else if (matches[1] != Tine.Tinebase.registry.get('currentAccount').accountLoginName) {
                    attr.id = 'otherUsers';
                }
            }
        }
        
        if(attr.name && typeof attr.name == 'object') {
            Ext.applyIf(attr, {
                text: Ext.util.Format.htmlEncode(attr.name.name),
                qtip: Ext.util.Format.htmlEncode(attr.name.name),
                leaf: !(attr.type == 'folder')
                //allowDrop: (attr.type == 'folder')
            });
        }
        else {
            Ext.applyIf(attr, {
                text: Ext.util.Format.htmlEncode(attr.name),
                qtip: Ext.util.Format.htmlEncode(attr.name),
                leaf: !!attr.account_grants && !(attr.type == 'folder')
                //allowDrop: !!attr.account_grants && attr.account_grants.addGrant
            });
        }
        
        
        // copy 'real' data to a node record NOTE: not a full record as we have no record reader here
        var nodeData = Ext.copyTo({}, attr, Tine.Filemanager.Model.Node.getFieldNames());
        attr.nodeRecord = new Tine.Filemanager.Model.Node(nodeData);
        
    },
    
    /**
     * treePanel on click handler
     * 
     * @param {Ext.tree.TreeNode} node
     * @param {Ext.EventObject} e
     */
    onClick: function(node, e) {
        Tine.Filemanager.TreePanel.superclass.onClick.call(this, node, e);
    },
    
    /**
     * initiates tree context menues
     * 
     * @private
     */
    initContextMenu: function() {
        
        this.contextMenuUserFolder = Tine.widgets.tree.ContextMenu.getMenu({
            nodeName: this.app.i18n._(this.containerName),
            actions: ['add', 'reload', 'delete', 'rename', 'grants'],
            scope: this,
            backend: 'Filemanager',
            backendModel: 'Node'
        });
            
        this.contextMenuRootFolder = Tine.widgets.tree.ContextMenu.getMenu({
            nodeName: this.app.i18n._(this.containerName),
            actions: ['add', 'reload'],
            scope: this,
            backend: 'Filemanager',
            backendModel: 'Node'
        });
        
        this.contextMenuOtherUserFolder = Tine.widgets.tree.ContextMenu.getMenu({
        	nodeName: this.app.i18n._(this.containerName),
        	actions: ['reload'],
        	scope: this,
        	backend: 'Filemanager',
        	backendModel: 'Node'
        });
        
        this.contextMenuContainerFolder = Tine.widgets.tree.ContextMenu.getMenu({
            nodeName: this.app.i18n._(this.containerName),
            actions: ['add', 'reload', 'delete', 'rename', 'grants'],
            scope: this,
            backend: 'Filemanager',
            backendModel: 'Node'
        });

        this.contextMenuReloadFolder = Tine.widgets.tree.ContextMenu.getMenu({
        	nodeName: this.app.i18n._(this.containerName),
        	actions: ['reload'],
        	scope: this,
        	backend: 'Filemanager',
        	backendModel: 'Node'
        });
    },
    
    /**
     * @private
     * - select default path
     */
    afterRender: function() {
                
        Tine.Filemanager.TreePanel.superclass.afterRender.call(this);

    },
    
    /**
     * show context menu
     * 
     * @param {Ext.tree.TreeNode} node
     * @param {Ext.EventObject} event
     */
    onContextMenu: function(node, event) {
        
        var currentAccount = Tine.Tinebase.registry.get('currentAccount');
        
        this.ctxNode = node;
        var container = node.attributes.nodeRecord.data,
            path = container.path;
        
        if (! Ext.isString(path) || node.isRoot) {
            return;
        }
   
        if (node.id == 'otherUsers' || (node.parentNode && node.parentNode.id == 'otherUsers')) {
            this.contextMenuOtherUserFolder.showAt(event.getXY());
        }
        else if (node.id == 'personal' || node.id == 'shared') {
        	this.contextMenuRootFolder.showAt(event.getXY());
        }
        else if (path.match(/^\/shared/) && (Tine.Tinebase.common.hasRight('admin', this.app.appName) 
                || Tine.Tinebase.common.hasRight('manage_shared_folders', this.app.appName))){
            this.contextMenuUserFolder.showAt(event.getXY());
        } 
        else if (path.match(/^\/shared/)){
        	this.contextMenuReloadFolder.showAt(event.getXY());
        } 
        else if (path.match(/^\/personal/) && path.match('/personal/' + currentAccount.accountLoginName)) {
            if(typeof container.name == 'object') {
                this.contextMenuContainerFolder.showAt(event.getXY());
            }
            else {
                this.contextMenuUserFolder.showAt(event.getXY());
            }
        }
        else if (path.match(/^\/personal/) && container.account_grants) {
            this.contextMenuUserFolder.showAt(event.getXY());
        }
    },
    
    
    /**
     * TODO: action handler should do this
     *  
     * called when tree selection changes
     * 
     * @param {} sm     SelectionModel
     * @param {Ext.tree.TreeNode} node
     */
    onSelectionChange: function(sm, node) {

        var grid = this.app.getMainScreen().getCenterPanel();
        
        grid.action_deleteRecord.disable();
        grid.action_upload.disable();
        
        if(!!node && !!node.isRoot) {
            grid.action_goUpFolder.disable();
        }
        else {
            grid.action_goUpFolder.enable();
        }
                
        if(node && node.attributes && node.attributes.nodeRecord.isCreateFolderAllowed()) {
            grid.action_createFolder.enable();
        }
        else {
            grid.action_createFolder.disable();
        }
        
        if(node && node.attributes && node.attributes.nodeRecord.isDropFilesAllowed()) {
            grid.action_upload.enable();
        }
        else {
            grid.action_upload.disable();
        }
        
        grid.currentFolderNode = node; 
        Tine.Filemanager.TreePanel.superclass.onSelectionChange.call(this, sm, node);
    
    },
    
    /**
     * convert containerPath to treePath
     * 
     * @param {String} containerPath
     * @return {String} tree path
     */
    getTreePath: function(valueItem) {
        
        var containerPath = '';
        if(valueItem && !valueItem.id) return valueItem.path;

        if(valueItem) {
            var node = this.getNodeById(valueItem.id);
            if(node) {
                var returnPath = node.getPath().replace('personal/'  + Tine.Tinebase.registry.get('currentAccount').accountLoginName, 'personal');
                return returnPath;
            }

            containerPath = valueItem.path;
        }
        var treePath = '/' + this.getRootNode().id + (containerPath !== '/' ? containerPath : '');

        // replace personal with otherUsers if personal && ! personal/myaccountid
        var matches = containerPath.match(/^\/personal\/{0,1}([0-9a-z_\-]*)\/{0,1}/i);
        if (matches) {
            if (matches[1] != Tine.Tinebase.registry.get('currentAccount').accountLoginName) {
                treePath = treePath.replace('personal', 'otherUsers');
            } 
            else {
                treePath = treePath.replace('personal/'  + Tine.Tinebase.registry.get('currentAccount').accountLoginName, 'personal');
                
            }
        }
        
        return treePath;
    },
    
   
    /**
     * files/folder got dropped on node
     * 
     * @param {Object} dropEvent
     * @private
     */
    onBeforeNodeDrop: function(dropEvent) {

        var nodes, target = dropEvent.target;
        
        if(dropEvent.data.selections) {
            nodes = dropEvent.data.grid.selModel.selections.items;
        }    
            
        if(!nodes && dropEvent.data.node) {
            nodes = [dropEvent.data.node];
        }
        
        Tine.Filemanager.fileRecordBackend.copyNodes(nodes, target, !dropEvent.rawEvent.ctrlKey);
        
        dropEvent.dropStatus = true;
        return true;
    },

    /**
     * folder delete handler
     */
    onFolderDelete: function(node) {
        var grid = this.app.getMainScreen().getCenterPanel();
        if(grid.currentFolderNode.isAncestor && typeof grid.currentFolderNode.isAncestor == 'function' 
        	&& grid.currentFolderNode.isAncestor(node)) {
            node.parentNode.select();
        }
        grid.getStore().reload();
    },

    /**
     * clone a tree node / create a node from grid node
     * 
     * @param node
     * @returns {Ext.tree.AsyncTreeNode}
     */
    cloneTreeNode: function(node, target) {
        var targetPath = target.attributes.path,
            newPath = '',
            copy;
        
        if(node.attributes) {
            var nodeName = node.attributes.name;
            if(typeof nodeName == 'object') {
                nodeName = nodeName.name;
            }
            newPath = targetPath + '/' + nodeName;
            
            copy = new Ext.tree.AsyncTreeNode({text: node.text, path: newPath, name: node.attributes.name
                , nodeRecord: node.attributes.nodeRecord, account_grants: node.attributes.account_grants});
        }
        else {
            var nodeName = node.data.name;
            if(typeof nodeName == 'object') {
                nodeName = nodeName.name;
            }
            
            var nodeData = Ext.copyTo({}, node.data, Tine.Filemanager.Model.Node.getFieldNames());
            var newNodeRecord = new Tine.Filemanager.Model.Node(nodeData);
             
            newPath = targetPath + '/' + nodeName;
            copy = new Ext.tree.AsyncTreeNode({text: nodeName, path: newPath, name: node.data.name
                , nodeRecord: newNodeRecord, account_grants: node.data.account_grants});           
        }
                
        copy.attributes.nodeRecord.beginEdit();
        copy.attributes.nodeRecord.set('path', newPath);
        copy.attributes.nodeRecord.endEdit();       
        
        copy.parentNode = target;
        return copy;
    },
    
    /**
     * create Tree node by given node data
     * 
     * @param nodeData
     * @param target
     * @returns {Ext.tree.AsyncTreeNode}
     */
    createTreeNode: function(nodeData, target) {

        var nodeName = nodeData.name;
        if(typeof nodeName == 'object') {
            nodeName = nodeName.name;
        }

        var newNodeRecord = new Tine.Filemanager.Model.Node(nodeData);

        var newNode = new Ext.tree.AsyncTreeNode({text: nodeName, path: nodeData.path, name: nodeData.name
            , nodeRecord: newNodeRecord, account_grants: nodeData.account_grants, id: nodeData.id});           

        newNode.attributes.nodeRecord.beginEdit();
        newNode.attributes.nodeRecord.set('path', nodeData.path);
        newNode.attributes.nodeRecord.endEdit();       

        newNode.parentNode = target;
        return newNode;
        
    },
    
    /**
     * TODO: move to Upload class or elsewhere??
     * updating fileRecord after creating node
     * 
     * @param response
     * @param request
     * @param upload
     */
    onNodeCreated: function(response, request, upload) {
       
        var app = Tine.Tinebase.appMgr.get('Filemanager'),
        grid = app.getMainScreen().getCenterPanel();

        var record = Ext.util.JSON.decode(response.responseText);

        var fileRecord = upload.fileRecord;
        fileRecord.beginEdit();
        fileRecord.set('contenttype', record.contenttype);
        fileRecord.set('created_by', Tine.Tinebase.registry.get('currentAccount'));
        fileRecord.set('creation_time', record.creation_time);
        fileRecord.set('revision', record.revision);
        fileRecord.set('last_modified_by', record.last_modified_by);
        fileRecord.set('last_modified_time', record.last_modified_time);
        fileRecord.set('status', 'complete');
        fileRecord.set('progress', 100);
        fileRecord.set('name', record.name);
        fileRecord.set('path', record.path);
        fileRecord.commit(false);

        grid.pagingToolbar.refresh.enable();

    },
    
    /**
     * copies uploaded temporary file to target location
     * 
     * @param upload    {Ext.ux.file.Upload}
     * @param file  {Ext.ux.file.Upload.file} 
     */
    onUploadComplete: function(upload, file) {
             
        var app = Tine.Tinebase.appMgr.get('Filemanager'),
        	treePanel = app.getMainScreen().getWestPanel().getContainerTreePanel(); 
        
        Tine.Tinebase.uploadManager.onUploadComplete();
        
        // $filename, $type, $tempFileId, $forceOverwrite
        Ext.Ajax.request({
            timeout: 10*60*1000, // Overriding Ajax timeout - important!
            params: {
                method: 'Filemanager.createNode',
                filename: upload.id,
                type: 'file',
                tempFileId: file.get('id'),
                forceOverwrite: true
            },
            success: treePanel.onNodeCreated.createDelegate(this, [upload], true), 
            failure: treePanel.onNodeCreated.createDelegate(this, [upload], true)
        });
        
    },
    
    /**
     * on upload failure
     * 
     * @private
     */
    onUploadFail: function () {
        Ext.MessageBox.alert(
            _('Upload Failed'), 
            _('Could not upload file. Filesize could be too big. Please notify your Administrator. Max upload size: ') + Tine.Tinebase.registry.get('maxFileUploadSize')
        ).setIcon(Ext.MessageBox.ERROR);
    },
    
    /**
     * add folder handler
     */
    onFolderAdd: function(nodeData) {
    	
    	var app = Tine.Tinebase.appMgr.get('Filemanager'),
			grid = app.getMainScreen().getCenterPanel();
    	
    	grid.getStore().reload();
        if(nodeData.error) {
            Tine.log.debug(nodeData);
        }
    },
    
    /**
     * handles renaming of a tree node / aka folder
     */
    onFolderRename: function(nodeData, node, newName) {
    	var app = Tine.Tinebase.appMgr.get('Filemanager'),
    		grid = app.getMainScreen().getCenterPanel();
    	
    	if(nodeData[0]) {
    		nodeData = nodeData[0];
    	};
    		
    	node.attributes.nodeRecord.beginEdit();
        node.attributes.nodeRecord.set('name', newName);
        node.attributes.nodeRecord.set('path', nodeData.path);
        node.attributes.path = nodeData.path;
        node.attributes.nodeRecord.commit(false);
        
        if(typeof node.attributes.name == 'object') {
        	node.attributes.name.name = newName;
        }
        else {
        	node.attributes.name = newName;
        }
                                        
    	grid.currenFolderNode = node;
    	
    	Tine.Filemanager.TreePanel.superclass.onSelectionChange.call(this, this.getSelectionModel(), node);
    	
    },
    
    /**
     * upload update handler
     * 
     * @param change {String} kind of change
     * @param upload {Ext.ux.file.Upload} upload
     * @param fileRecord {file} fileRecord
     * 
     */
    onUpdate: function(change, upload, fileRecord) {
    	
    	var app = Tine.Tinebase.appMgr.get('Filemanager'),
    		grid = app.getMainScreen().getCenterPanel(),
    		treePanel = app.getMainScreen().getWestPanel().getContainerTreePanel(),
    		rowsToUpdate = grid.getStore().query('name', fileRecord.get('name'));
    	
    	if(change == 'uploadstart') {
    		Tine.Tinebase.uploadManager.onUploadStart();
    	}
    	else if(change == 'uploadfailure') {
    		treePanel.onUploadFail();
    	}
    	
    	if(rowsToUpdate.get(0)) {
    		if(change == 'uploadcomplete') {   			
    			treePanel.onUploadComplete(upload, fileRecord);
    		}
    		else if(change == 'uploadfinished') {
    			rowsToUpdate.get(0).set('size', upload.fileSize);	
    			rowsToUpdate.get(0).set('contenttype', fileRecord.get('contenttype'));	
    		}
    		rowsToUpdate.get(0).afterEdit();
    		rowsToUpdate.get(0).commit(false);
    	}   	
    },
    
    /**
     * handels tree drop of object from outside the browser
     * 
     * @param fileSelector
     * @param targetNodeId
     */
    dropIntoTree: function(fileSelector, event) {
          	
    	var treePanel = fileSelector.component,
    		app = treePanel.app,
    		grid = app.getMainScreen().getCenterPanel(),    
    		targetNode,
            targetNodePath;
            

    	var targetNodeId;
    	var treeNodeAttribute = event.getTarget('div').attributes['ext:tree-node-id'];
    	if(treeNodeAttribute) {
    		targetNodeId = treeNodeAttribute.nodeValue;
    		targetNode = treePanel.getNodeById(targetNodeId);
    		targetNodePath = targetNode.attributes.path;

    	};         

        if(!targetNode.attributes.nodeRecord.isDropFilesAllowed()) {
            Ext.MessageBox.alert(
                    _('Upload Failed'), 
                    app.i18n._('Putting files in this folder is not allowed!')
                ).setIcon(Ext.MessageBox.ERROR);
            
            return;
        };    
      
        var files = fileSelector.getFileList(),
            filePathsArray = [],
            uploadKeyArray = [],
            addToGridStore = false;

        Ext.each(files, function (file) {

            var fileName = file.name || file.fileName,
                filePath = targetNodePath + '/' + fileName;           

            var upload = new Ext.ux.file.Upload({
                file: file,
                fileSelector: fileSelector,
                id: filePath
            });

        var uploadKey = Tine.Tinebase.uploadManager.queueUpload(upload);     
            
            filePathsArray.push(filePath);
            uploadKeyArray.push(uploadKey);
  
            addToGridStore = grid.currentFolderNode.id === targetNodeId;
            
                      
        }, this);
        
        var params = {
                filenames: filePathsArray,
                type: "file",
                tempFileIds: [],
                forceOverwrite: false
        };
        Tine.Filemanager.fileRecordBackend.createNodes(params, uploadKeyArray, addToGridStore);

    }
    
});
