/*
 * Tine 2.0
 * 
 * @package     Tinebase
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <alex@stintzing.net>
 * @copyright   Copyright (c) 2009-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.ns('Tine.widgets.editDialog');

/**
 * @namespace   Tine.widgets.editDialog
 * @class       Tine.widgets.dialog.MultipleEditDialogPlugin
 * @author      Alexander Stintzing <alex@stintzing.net>
 * 
 * @plugin for Tine.widgets.editDialog
 */
Tine.widgets.dialog.MultipleEditDialogPlugin = function(config) {
    Ext.apply(this, config);
};

Tine.widgets.dialog.MultipleEditDialogPlugin.prototype = {
    /**
     * the application calling this plugin
     */
    app : null,
    /**
     * the editDialog the plugin is applied to
     */
    editDialog : null,
    /**
     * the selected records 
     */
    selectedRecords: null,
    /**
     * the selections' filter
     */
    selectionFilter: null,
    /**
     * this record is created on the fly and never saved as is, only changes to this record are sent to the backend
     */
    interRecord: null,   
    /**
     * a shorthand for this.editDialog.getForm() 
     */
    form : null,
    /**
     * Array which holds the fieldConfigs which can be handled by this plugin
     * Array of Objects: { key: <the raw key>, type: <custom/default>', formField: <the corresponding form field>, recordKey: <used for getters/setters of the record>}
     * @type Array
     */
    handleFields: null,
    
    /**
     * initializes the plugin
     */    
    init : function(editDialog) {
        this.interRecord = new editDialog.recordClass(editDialog.recordClass.getDefaultData());
        this.editDialog = editDialog;
        this.app = Tine.Tinebase.appMgr.get(this.editDialog.app);
        this.form = this.editDialog.getForm();    
        this.editDialog.on('render', this.onAfterRender, this);
        this.handleFields = [];
        this.editDialog.initRecord = Ext.emptyFn;
        this.editDialog.onApplyChanges = this.editDialog.onApplyChanges.createInterceptor(this.onRecordUpdate, this); 
        this.editDialog.onRecordLoad = this.editDialog.onRecordLoad.createInterceptor(this.onRecordLoad, this);
        this.editDialog.onRecordUpdate = Ext.emptyFn;//this.editDialog.onRecordUpdate.createInterceptor(this.onRecordUpdate, this);
        if (this.editDialog.isMultipleValid) this.editDialog.isValid = this.editDialog.isMultipleValid;       
    },

    /**
     * find out which fields have differences
     */
    onRecordLoad : function() {

        if (!this.editDialog.rendered) {
            this.onRecordLoad.defer(250, this);
            return;
        }

        Ext.each(this.handleFields, function(field) {
            var refData = false; 
            
            Ext.each(this.editDialog.selectedRecords, function(selection, index) {               
                selection = (field.type == 'custom') ? selection.customfields : selection;

                // the first record of the selected is the reference
                if(refData === false) {
                    refData = selection[field.key];
                    return true;
                }

                if (Ext.encode(selection[field.key]) != Ext.encode(refData)) {
                    this.interRecord.set(field.recordKey, '');
                    this.setFieldValues(field, false);
                    return false;
                } else {
                    if (index == this.editDialog.selectedRecords.length - 1) {
                        this.interRecord.set(field.recordKey, refData);
                        this.setFieldValues(field, true);
                        return true;
                    }
                }
            }, this);
        }, this);

        this.interRecord.dirty = false;
        this.interRecord.modified = {};
        
        this.editDialog.getForm().loadRecord(this.interRecord);
        this.editDialog.getForm().clearInvalid();  
        this.editDialog.window.setTitle(String.format(_('Edit {0} {1}'), this.editDialog.selectedRecords.length, this.editDialog.i18nRecordsName));

        Tine.log.debug('loading of the following intermediate record completed:');
        Tine.log.debug(this.interRecord);
        
        this.editDialog.updateToolbars(this.interRecord, this.editDialog.recordClass.getMeta('containerProperty'));

        Ext.each(this.editDialog.tbarItems, function(item) {
            item.setDisabled(true);
            item.multiEditable = false;
            });

        Ext.QuickTips.init();
        
        this.editDialog.loadMask.hide();
        return false;
    },

    /**
     * handle fields for multiedit
     */
    onAfterRender : function() {

        Ext.each(this.editDialog.getDisableOnEditMultiple(), function(item) {
            item.setDisabled(true);
            item.multiEditable = false;
        });

        var keys = [];
        
        Ext.each(this.form.record.store.fields.keys, function(key) {
            var field = this.form.findField(key);
            if (!field) return true;
            keys.push({key: key, type: 'default', formField: field, recordKey: key});
        }, this);
        
        Ext.each(this.editDialog.cfConfigs, function(config) {
            var field = this.form.findField('customfield_' + config.data.name);
            if (!field) return true;
            keys.push({key: config.data.name, type: 'custom', formField: field, recordKey: '#' + config.data.name});
        }, this);

        Ext.each(keys, function(field) {
            var ff = field.formField;
            if ((!(ff.isXType('textfield'))) && (!(ff.isXType('checkbox'))) || ff.multiEditable === false) {
                ff.setDisabled(true);
                this.interRecord.set(field.recordKey, '');
                return true;
            }
            
            this.handleFields.push(field);

            if (ff.isXType('textfield')) {
                ff.isClearable = true;
                ff.on('focus', function() {
                  if (!(ff.isXType('extuxclearabledatefield', true)) && (ff.isClearable !== false)) {
                    var subLeft = 0;
                    if (ff.isXType('trigger')) subLeft += 17;

                    var el = this.el.parent().select('.tinebase-editmultipledialog-clearer'), 
                        width = this.getWidth(), 
                        left = (width - 18 - subLeft) + 'px';

                    if (el.elements.length > 0) {
                        el.setStyle({left: left});
                        el.removeClass('hidden');
                        return;
                    }

                    // create Button
                    var button = new Ext.Element(document.createElement('img'));
                    button.set({
                        'src': Ext.BLANK_IMAGE_URL,
                        'title': _('Delete value from all selected records'),
                        'class': 'tinebase-editmultipledialog-clearer',
                        'style': 'left:' + left
                        });
                    
                    button.addClassOnOver('over');
                    button.addClassOnClick('click');

                    button.on('click', function() {
                        if(button.hasClass('undo')) {
                            this.setValue(this.originalValue);
                            button.set({title: _('Delete value from all selected records')});
                            if (this.multi) this.cleared = false;
                        } else {
                            if (this.multi) this.cleared = true;
                            this.setValue('');
                            button.set({title: _('Undo delete value from all selected records')});
                        }
                        this.fireEvent('blur',this);
                    }, this);
                    
                    this.el.insertSibling(button);
                  }
                    this.on('blur', function() {
                        var el = this.el.parent().select('.tinebase-editmultipledialog-clearer');
                        var ar = this.el.parent().select('.tinebase-editmultipledialog-dirty');
                        if ((this.originalValue != this.getValue()) || this.cleared) {
                            this.removeClass('tinebase-editmultipledialog-noneedit');

                            if(ar.elements.length > 0) {
                                ar.setStyle('display','block');
                            } else {
                                var arrow = new Ext.Element(document.createElement('img'));
                                arrow.set({
                                    'src': Ext.BLANK_IMAGE_URL,
                                    'class': 'tinebase-editmultipledialog-dirty',
                                    'height': 5,
                                    'width': 5
                                });
                                this.el.insertSibling(arrow);
                            }
                            
                            this.edited = true;
                            el.addClass('undo');
                            el.removeClass('hidden');
                        } else {
                            this.edited = false;
                            
                            if(ar.elements.length > 0) {
                                ar.setStyle('display','none');
                            }
                            
                            if (this.multi) {
                                this.setReadOnly(true);
                                this.addClass('tinebase-editmultipledialog-noneedit');
                            }
                            el.removeClass('undo');
                            el.addClass('hidden');
                        }
                    });
                    this.un('focus');
                });
            } 
        }, this);
    },
    
    /**
     * Set field values
     * @param {} Ext.form.Field field
     * @param {} String fieldKey
     * @param {} Boolean samevalue
     */
    setFieldValues: function(field, samevalue) {
        
        var ff = field.formField;
        
        if (!samevalue) {
            ff.setReadOnly(true);
            ff.addClass('tinebase-editmultipledialog-noneedit');
            ff.multi = true;
            ff.edited = false;
            ff.setValue('');
            ff.originalValue = '';

            Ext.QuickTips.register({
                target: ff,
                dismissDelay: 30000,
                title: _('Different Values'),
                text: _('This field has different values. Editing this field will overwrite the old values.'),
                width: 200
            });
            
            if (ff.isXType('checkbox')) {
                ff.getEl().wrap({tag: 'span', 'class': 'tinebase-editmultipledialog-dirtycheck'});
            } else {
                ff.on('focus', function() {
                    if (this.readOnly) this.originalValue = this.getValue();
                    this.setReadOnly(false);
                });
            }
        } else {
            
            ff.edited = false;
            ff.setValue(this.interRecord.get(field.recordKey));
            
            if (ff.isXType('checkbox')) {
                ff.originalValue = ff.checked;
            } else {
                ff.on('focus', function() {
                    if (!this.edited) this.originalValue = this.getValue();
                });
            }
        }
        
        if (ff.isXType('checkbox')) {
            ff.on('check', function() {this.edited = (this.originalValue != this.getValue()); });
        }
        
    },
    
    /**
     * is called when the form is submitted. only fieldvalues with edited=true are committed 
     * @return {Boolean}
     */
    onRecordUpdate : function() {
        this.changedHuman = '<br /><br /><ul>';
        var changes = [];
        
        Ext.each(this.handleFields, function(field) {
            var ff = field.formField,
            	renderer = Ext.util.Format.htmlEncode;
        
            if (ff.edited === true) {
                var label = ff.fieldLabel ? ff.fieldLabel : ff.boxLabel;
                    label = label ? label : ff.ownerCt.title; 

                changes.push({name: ff.getName(), value: ff.getValue()});
                this.changedHuman += '<li><span style="font-weight:bold">' + label + ':</span> ';
                if(ff.isXType('checkbox')) renderer = Tine.Tinebase.common.booleanRenderer;
                this.changedHuman += ff.lastSelectionText ? renderer(ff.lastSelectionText) : renderer(ff.getValue());  
                this.changedHuman += '</li>';
            }
        }, this);
        
        this.changedHuman += '</ul>';

        if (changes.length == 0) {
            this.editDialog.onCancel();
            return false;
        }

        if(!this.editDialog.isMultipleValid()) {
            Ext.MessageBox.alert(_('Errors'), _('Please fix the errors noted.'));
            Ext.each(this.handleFields, function(item) {
                if(item.activeError) {
                    if(!item.edited) item.activeError = null;
                }
            });
            return false;

        } else {
            var filter = this.editDialog.selectionFilter;
            Ext.MessageBox.confirm(
                _('Confirm'),
                String.format(_('Do you really want to change these {0} records?') + this.changedHuman,
                this.editDialog.selectedRecords.length),
                function(_btn) {
                if (_btn == 'yes') {
                    Ext.MessageBox.wait(_('Please wait'),_('Applying changes'));
                    Ext.Ajax.request({
                        url: 'index.php',
                        timeout: 120000,
                        params: {
                            method: 'Tinebase.updateMultipleRecords',
                            appName: this.editDialog.recordClass.getMeta('appName'),
                            modelName: this.editDialog.recordClass.getMeta('modelName'),
                            changes: changes,
                            filter: filter
                        },
                        success: function(_result, _request) {                           
                            Ext.MessageBox.hide();
                            var resp = Ext.decode(_result.responseText);
                            if(resp.failcount > 0) {
                                var window = Tine.widgets.dialog.MultipleEditResultSummary.openWindow({
                                    response: _result.responseText,
                                    appName: this.app.appName,
                                    recordClass: this.editDialog.recordClass
                                });
                                window.on('close', function() {
                                    this.editDialog.fireEvent('update');
                                    this.editDialog.onCancel();
                                },this);
                            } else {
                                this.editDialog.fireEvent('update');
                                this.editDialog.onCancel();
                            }
                        },
                        scope: this
                    });
                }
            }, this);
         }
        return false;
    }
};
