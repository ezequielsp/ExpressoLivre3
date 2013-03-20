/*
 * Tine 2.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @copyright   Copyright (c) 2013 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Tine.HumanResources');

/**
 * @namespace   Tine.HumanResources
 * @class       Tine.HumanResources.ContractEditDialog
 * @extends     Tine.widgets.dialog.EditDialog
 * 
 * <p>Contract Compose Dialog</p>
 * <p></p>
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * 
 * @param       {Object} config
 * @constructor
 * Create a new Tine.HumanResources.ContractEditDialog
 */
Tine.HumanResources.ContractEditDialog = Ext.extend(Tine.widgets.dialog.EditDialog, {
    
    /**
     * @private
     */
    appName: 'HumanResources',
    tbarItems: [{xtype: 'widget-activitiesaddbutton'}],
    evalGrants: false,
    
    /**
     * just update the contract grid panel, no persisten
     * 
     * @type String
     */
    mode: 'local',
    
    /**
     * The record is editable if the valid interval is in the future or not older than 2 hours
     * This property is set accordingly
     * 
     * @type 
     */
    allowEdit: null,

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
        Tine.HumanResources.ContractEditDialog.superclass.initComponent.call(this);
    },
    
    /**
     * executed after record got updated from proxy, if json Data is given, it's used
     * 
     * @private
     */
    onRecordLoad: function(jsonData) {
        // interrupt process flow until dialog is rendered
        if (! this.rendered) {
            this.onRecordLoad.defer(250, this);
            return;
        }
        
        Tine.HumanResources.ContractEditDialog.superclass.onRecordLoad.call(this);
        
        var jsonData = jsonData ? Ext.decode(jsonData) : ! Ext.isEmpty(this.record.get('workingtime_json')) ? Ext.decode(this.record.get('workingtime_json')) : null;
        if (jsonData) {
            this.applyJsonData(jsonData);
        }
        
        if (! this.record.id) {
            this.getForm().findField('feast_calendar_id').setValue(Tine.HumanResources.registry.get('defaultFeastCalendar'));
        }
        
        // disable fields if the record was created 2 hours before and the start_date is in the past
        var now = new Date(),
            modified = this.record.get('creation_time');
        
        if (modified) {
            var mod = modified.add(Date.HOUR, 2);
            var setDisabled = (this.record.get('start_date') < now && mod < now);
            
            if (setDisabled) {
                this.getForm().items.each(function(formField) {
                    formField.disable();
                }, this);
                this.action_saveAndClose.disable();
            }
        }
    },
    
    /**
     * applies the json data to the form
     * 
     * @param {Object} jsonData
     */
    applyJsonData: function(jsonData) {
        var days = jsonData.days,
        form = this.getForm(),
        sum = 0.0;

        for (var index = 0; index < 7; index++) {
            form.findField('weekdays_' + index).setValue(days[index]);
            sum = sum + parseFloat(days[index]);
        }
        
        form.findField('working_hours').setValue(sum);
    },
    
    updateWorkingHours: function(formField, newValue, oldValue) {
        var sum = this.getForm().findField('working_hours').getValue();
        this.getForm().findField('working_hours').setValue(sum - oldValue + newValue);
    },
    
    /**
     * returns appropriate json for the template or the contract
     * 
     * @return {String}
     */
    getJson: function() {
        var values = this.getForm().getFieldValues(),
            days = [];
        
        for (var index = 0; index < 7; index++) {
            days[index] = values['weekdays_' + index];
        }
        
        return Ext.encode({days: days});
    },

    /**
     * closes open subpanels on cancel
     */
    onCancel: function() {
        Tine.HumanResources.ContractEditDialog.superclass.onCancel.call(this);
    },
    
    /**
     * show message if there are some subpanels
     */
    onSaveAndClose: function() {
        Tine.HumanResources.ContractEditDialog.superclass.onSaveAndClose.call(this);
    },
    
    /**
     * executed when record gets updated from form
     * @private
     */
    onRecordUpdate: function() {
        Tine.HumanResources.ContractEditDialog.superclass.onRecordUpdate.call(this);
        
        this.record.set('workingtime_json', this.getJson());
        this.record.set('feast_calendar_id', this.getForm().findField('feast_calendar_id').selectedContainer);
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
        var weekdayFieldDefaults = {
            xtype: 'numberfield',
            decimalPrecision: 2,
            decimalSeparator: Tine.Tinebase.registry.get('decimalSeparator'),
            anchor: '100%',
            labelSeparator: '',
            allowBlank: false,
            columnWidth: 1/7,
            listeners: {
                scope:  this,
                change: this.updateWorkingHours.createDelegate(this)
            }
        };
        
        return {
            xtype: 'tabpanel',
            border: false,
            plain:true,
            plugins: [{
                ptype : 'ux.tabpanelkeyplugin'
            }],
            activeTab: 0,
            border: false,
            items: [{
            title: this.app.i18n._('Contract'),
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
                    title: this.app.i18n._('Contract'),
                    items: [{
                        xtype: 'columnform',
                        labelAlign: 'top',
                        items: [[
                            {name: 'vacation_days', fieldLabel: this.app.i18n._('Vacation Days')},
                            Tine.widgets.form.RecordPickerManager.get('Tinebase', 'Container', {
                                containerName: this.app.i18n._('Calendar'),
                                containersName: this.app.i18n._('Calendars'),
                                appName: 'Calendar',
                                requiredGrant: 'readGrant',
                                hideTrigger2: true,
                                allowBlank: true,
                                blurOnSelect: true,
                                fieldLabel: this.app.i18n._('Feast Calendar'),
                                name: 'feast_calendar_id'
                            })
                        ], [
                            {xtype: 'extuxclearabledatefield', name: 'start_date', fieldLabel: this.app.i18n._('Start Date') },
                            {xtype: 'extuxclearabledatefield', name: 'end_date', fieldLabel: this.app.i18n._('End Date')}
                        ]]
                    }]
                }, {
                    xtype: 'fieldset',
                    layout: 'hfit',
                    autoHeight: true,
                    title: this.app.i18n._('Working Time'),
                    items: [{
                        xtype: 'columnform',
                        labelAlign: 'top',
                        items: [
                        [
                                Tine.widgets.form.RecordPickerManager.get('HumanResources', 'WorkingTime', {
                                    value: this.record,
                                    fieldLabel: this.app.i18n._('Choose the template'),
                                    selectedRecord: this.record,
                                    ref: '../../../../../../../templateChooser',
                                    columnWidth: .5,
                                    listeners: {
                                        scope:  this,
                                        select: this.updateTemplate.createDelegate(this)
                                    }
                                }), {
                                    fieldLabel: this.app.i18n._('Working Hours per week'),
                                    xtype: 'numberfield',
                                    decimalPrecision: 2,
                                    decimalSeparator: Tine.Tinebase.registry.get('decimalSeparator'),
                                    name: 'working_hours',
                                    readOnly: true,
                                    columnWidth: .5
                                }
//                                , {
//                                   columnWidth: .1,
//                                   xtype:'button',
//                                   iconCls: 'HumanResourcesWorkingTimeFormButton',
//                                   tooltip: Tine.Tinebase.common.doubleEncode(this.app.i18n._('Save working time as template')),
//                                   fieldLabel: '&nbsp;'
//                                   ,
//                                   listeners: {
//                                        scope: this,
//                                        click: this.onTemplateCreate
//                                   }
//                                }
                            ],
                            
                            [Ext.apply({
                                fieldLabel: _('Mon.'),
                                name: 'weekdays_0'
                            }, weekdayFieldDefaults), Ext.apply({
                                fieldLabel: _('Tue.'),
                                name: 'weekdays_1'
                            }, weekdayFieldDefaults), Ext.apply({
                                fieldLabel: _('Wed.'),
                                name: 'weekdays_2'
                            }, weekdayFieldDefaults), Ext.apply({
                                fieldLabel: _('Thu.'),
                                name: 'weekdays_3'
                            }, weekdayFieldDefaults), Ext.apply({
                                fieldLabel: _('Fri.'),
                                name: 'weekdays_4'
                            }, weekdayFieldDefaults), Ext.apply({
                                fieldLabel: _('Sat.'),
                                name: 'weekdays_5'
                            }, weekdayFieldDefaults), Ext.apply({
                                fieldLabel: _('Sun.'),
                                name: 'weekdays_6'
                            }, weekdayFieldDefaults)]
                            ]
                    }
                    ]
                }]
            }]
        }]
        };
    },
    
    updateTemplate: function(combo, record, index) {
        this.applyJsonData(Ext.decode(record.get('json')));
    }
});

/**
 * HumanResources Edit Popup
 * 
 * @param   {Object} config
 * @return  {Ext.ux.Window}
 */
Tine.HumanResources.ContractEditDialog.openWindow = function (config) {
    var id = (config.record && config.record.id) ? config.record.id : 0;
    var window = Tine.WindowFactory.getWindow({
        width: 800,
        height: 620,
        name: Tine.HumanResources.ContractEditDialog.prototype.windowNamePrefix + id,
        contentPanelConstructor: 'Tine.HumanResources.ContractEditDialog',
        contentPanelConstructorConfig: config
    });
    return window;
};
