/*
 * Tine 2.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @copyright   Copyright (c) 2012 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Tine.HumanResources');

/**
 * @namespace   Tine.HumanResources
 * @class       Tine.HumanResources.EmployeeEditDialog
 * @extends     Tine.widgets.dialog.EditDialog
 * 
 * <p>Employee Compose Dialog</p>
 * <p></p>
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * 
 * @param       {Object} config
 * @constructor
 * Create a new Tine.HumanResources.EmployeeEditDialog
 */
Tine.HumanResources.EmployeeEditDialog = Ext.extend(Tine.widgets.dialog.EditDialog, {
    
    /**
     * @private
     */
    windowNamePrefix: 'EmployeeEditWindow_',
    appName: 'HumanResources',
    recordClass: Tine.HumanResources.Model.Employee,
    recordProxy: Tine.HumanResources.employeeBackend,
    tbarItems: [{xtype: 'widget-activitiesaddbutton'}],
    evalGrants: false,
    showContainerSelector: false,
    
    /**
     * show private Information (autoset due to rights)
     * @type 
     */
    showPrivateInformation: null,
    
    /**
     * overwrite update toolbars function (we don't have record grants yet)
     * @private
     */
    updateToolbars: function() {

    },
    /**
     * inits the component
     */
    initComponent: function() {
        this.showPrivateInformation = (Tine.Tinebase.common.hasRight('edit_private','HumanResources')) ? true : false;
        Tine.HumanResources.EmployeeEditDialog.superclass.initComponent.call(this);
    },
    
    /**
     * executed after record got updated from proxy
     * 
     * @private
     */
    onRecordLoad: function() {
        // interrupt process flow until dialog is rendered
        if (! this.rendered) {
            this.onRecordLoad.defer(250, this);
            return;
        }
        this.contractGridPanel.onRecordLoad();
        Tine.HumanResources.EmployeeEditDialog.superclass.onRecordLoad.call(this);
    },

    /**
     * executed when record gets updated from form
     * @private
     */
    onRecordUpdate: function() {
        var contracts = [];
        this.contractGridPanel.store.query().each(function(contract) {
            contracts.push(contract.data);
        }, this);
        
        this.record.set('contracts', contracts);
        Tine.HumanResources.EmployeeEditDialog.superclass.onRecordUpdate.call(this);
    },
    
    /**
     * returns dialog
     * 
     * NOTE: when this method gets called, all initalisation is done.
     * 
     * @return {Object}
     * @private
     */
    getFormItems: function() {
        var formFieldDefaults = {
            xtype:'textfield',
            anchor: '100%',
            labelSeparator: '',
            columnWidth: .333
        };
        
        this.contractGridPanel = new Tine.HumanResources.ContractGridPanel({
            app: this.app,
            editDialog: this
        });
        
        this.freetimeGridPanel = new Tine.HumanResources.FreeTimeGridPanel({
            app: this.app,
            editDialog: this,
            title: this.app.i18n._('Free Time'),
            frame: true,
            border: true,
            autoScroll: true,
            layout: 'fit'
        });
        
        return {
            xtype: 'tabpanel',
            border: false,
            plain:true,
            plugins: [{
                ptype : 'ux.tabpanelkeyplugin'
            }],
            activeTab: 0,
            border: false,
            items:[{
                title: this.app.i18n._('Employee'),
                autoScroll: true,
                border: false,
                frame: true,
                layout: 'border',
                items: [{
                    region: 'center',
                    layout: 'hfit',
                    border: false,
                    items: [{
                        xtype: 'fieldset',
                        layout: 'hfit',
                        autoHeight: true,
                        title: this.app.i18n._('Employee'),
                        items: [{
                            xtype: 'columnform',
                            labelAlign: 'top',
                            formDefaults: formFieldDefaults,
                            items: [[{
                                    fieldLabel: this.app.i18n._('Number'),
                                    name: 'number',
                                    allowBlank: false,
                                    columnWidth: .125
                                }, 
                                    Tine.widgets.form.RecordPickerManager.get('Addressbook', 'Contact', {
                                        userOnly: true,
                                        useAccountRecord: true,
                                        blurOnSelect: true,
                                        name: 'account_id',
                                        fieldLabel: this.app.i18n._('Account'),
                                        columnWidth: .380,
                                        ref: '../../../../../../../contactPicker',
                                        allowBlank: true,
                                        listeners: {
                                            scope: this,
                                            blur: function() { 
                                                if(this.contactPicker.selectedRecord) {
                                                    this.contactButton.enable();
                                                } else {
                                                    this.contactButton.disable();
                                                }
                                            }
                                        }
                                    }), {
                                   columnWidth: .045,
                                   xtype:'button',
                                   ref: '../../../../../../../contactButton',
                                   iconCls: 'applyContactData',
                                   tooltip: Ext.util.Format.htmlEncode(this.app.i18n._('Apply contact data on form')),
                                   disabled: true,
                                   fieldLabel: '&nbsp;',
                                   listeners: {
                                        scope: this,
                                        click: function() {
                                            var sr = this.contactPicker.selectedRecord;
                                            if(sr) {
                                                this.form.findField('n_fn').setValue(sr.get('n_fn'));
                                                if(this.showPrivateInformation) {
                                                    this.form.findField('bank_account_holder').setValue(sr.get('n_fn'));
                                                    Ext.each(['countryname', 'locality', 'postalcode', 'region', 'street', 'street2'], function(f){
                                                        this.form.findField(f).setValue(sr.get('adr_two_'+f));
                                                    }, this);
                                                    
                                                    Ext.each(['email', 'tel_home', 'tel_cell', 'bday'], function(f){
                                                        this.form.findField(f).setValue(sr.get(f));
                                                    }, this);
                                                    
                                                }
                                            }
                                        }
                                   }
                                }, {
                                    columnWidth: .450,
                                    allowBlank: false,
                                    fieldLabel: this.app.i18n._('Full Name'),
                                    name: 'n_fn'
                                }]
                            ]
                        }]
                    }, {
                        xtype: 'fieldset',
                        layout: 'hfit',
                        autoHeight: true,
                        title: this.app.i18n._('Personal Information'),
                        disabled: ! this.showPrivateInformation,
                        items: [{
                            xtype: 'columnform',
                            labelAlign: 'top',
                            formDefaults: Ext.apply(Ext.decode(Ext.encode(formFieldDefaults)), {disabled: ! this.showPrivateInformation, readOnly: ! this.showPrivateInformation}),
                            items: [
                                [{
                                    xtype: 'widget-countrycombo',
                                    name: 'countryname',
                                    fieldLabel: this.app.i18n._('Country')
                                }, {
                                    name: 'locality',
                                    fieldLabel: this.app.i18n._('Locality')
                                }, {
                                    name: 'postalcode',
                                    fieldLabel: this.app.i18n._('Postalcode')
                                }], [{
                                    name: 'region',
                                    fieldLabel: this.app.i18n._('Region')
                                }, {
                                    name: 'street',
                                    fieldLabel: this.app.i18n._('Street')
                                }, {
                                    name: 'street2',
                                    fieldLabel: this.app.i18n._('Street2')
                                }], [{
                                    name: 'email',
                                    fieldLabel: this.app.i18n._('E-Mail')
                                }, {
                                    name: 'tel_home',
                                    fieldLabel: this.app.i18n._('Telephone Number')
                                }, {
                                    name: 'tel_cell',
                                    fieldLabel: this.app.i18n._('Cell Phone Number')
                                }], [{
                                    xtype: 'extuxclearabledatefield',
                                    name: 'bday',
                                    fieldLabel: this.app.i18n._('Birthday')
                                }, {
                                    xtype: 'extuxclearabledatefield',
                                    name: 'employment_begin',
                                    fieldLabel: this.app.i18n._('Employment begin')
                                }, {
                                    xtype: 'extuxclearabledatefield',
                                    name: 'employment_end',
                                    allowBlank: true,
                                    fieldLabel: this.app.i18n._('Employment end')
                                }
                            ]]
                        }]
                    }, {
                        xtype: 'fieldset',
                        layout: 'hfit',
                        autoHeight: true,
                        title: this.app.i18n._('Internal Information'),
                        disabled: ! this.showPrivateInformation,
                        items: [{
                            xtype: 'columnform',
                            labelAlign: 'top',
                            formDefaults: Ext.apply(Ext.decode(Ext.encode(formFieldDefaults)), {disabled: ! this.showPrivateInformation, readOnly: ! this.showPrivateInformation}),
                            items: [
                                [
                                Tine.widgets.form.RecordPickerManager.get('Addressbook', 'Contact', {
                                        name: 'supervisor_id',
                                        fieldLabel: this.app.i18n._('Supervisor'),
                                        useAccountRecord: true,
                                        userOnly: true,
                                        allowBlank: true
                                })
                            ]]
                        }]
                    }, {
                        xtype: 'fieldset',
                        layout: 'hfit',
                        autoHeight: true,
                        title: this.app.i18n._('Banking Information'),
                        disabled: ! this.showPrivateInformation,
                        items: [{
                            xtype: 'columnform',
                            labelAlign: 'top',
                            formDefaults: Ext.apply(Ext.decode(Ext.encode(formFieldDefaults)), {disabled: ! this.showPrivateInformation, readOnly: ! this.showPrivateInformation}),
                            items: [
                                [{
                                    name: 'bank_account_holder',
                                    fieldLabel: this.app.i18n._('Account Holder')
                                }, {
                                    name: 'bank_account_number',
                                    fieldLabel: this.app.i18n._('Account Number')
                                }, {
                                    name: 'bank_name',
                                    fieldLabel: this.app.i18n._('Bank Name')
                                }], [{
                                    name: 'bank_code_number',
                                    fieldLabel: this.app.i18n._('Code Number')
                                }
                            ]]
                        }]
                    }
                    
                    ]
                }, {
                    // activities and tags
                    layout: 'accordion',
                    animate: true,
                    region: 'east',
                    width: 210,
                    split: true,
                    collapsible: true,
                    collapseMode: 'mini',
                    header: false,
                    margins: '0 5 0 5',
                    border: true,
                    items: [
                        new Ext.Panel({
                            title: this.app.i18n._('Description'),
                            iconCls: 'descriptionIcon',
                            layout: 'form',
                            labelAlign: 'top',
                            border: false,
                            items: [{
                                style: 'margin-top: -4px; border 0px;',
                                labelSeparator: '',
                                xtype: 'textarea',
                                name: 'description',
                                hideLabel: true,
                                grow: false,
                                preventScrollbars: false,
                                anchor: '100% 100%',
                                emptyText: this.app.i18n._('Enter description'),
                                requiredGrant: 'editGrant'
                            }]
                        }),
                        new Tine.widgets.activities.ActivitiesPanel({
                            app: 'HumanResources',
                            showAddNoteForm: false,
                            border: false,
                            bodyStyle: 'border:1px solid #B5B8C8;'
                        }),
                        new Tine.widgets.tags.TagPanel({
                            app: 'HumanResources',
                            border: false,
                            bodyStyle: 'border:1px solid #B5B8C8;'
                        })
                    ]
                }]
            }, 
            new Tine.widgets.activities.ActivitiesTabPanel({
                app: this.appName,
                record_id: this.record.id,
                record_model: this.appName + '_Model_' + this.recordClass.getMeta('modelName')
                }), 
            this.contractGridPanel,
            this.freetimeGridPanel
            ]
        };
    }
});

/**
 * HumanResources Edit Popup
 * 
 * @param   {Object} config
 * @return  {Ext.ux.Window}
 */
Tine.HumanResources.EmployeeEditDialog.openWindow = function (config) {
    var id = (config.record && config.record.id) ? config.record.id : 0;
    var window = Tine.WindowFactory.getWindow({
        width: 800,
        height: 570,
        name: Tine.HumanResources.EmployeeEditDialog.prototype.windowNamePrefix + id,
        contentPanelConstructor: 'Tine.HumanResources.EmployeeEditDialog',
        contentPanelConstructorConfig: config
    });
    return window;
};
