/*
 * Tine 2.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2010-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 * TODO         container tag filter should extend this
 */
Ext.ns('Tine.widgets.grid');

/**
 * @namespace   Tine.widgets.grid
 * @class       Tine.widgets.grid.PickerFilter
 * @extends     Tine.widgets.grid.FilterModel
 */
Tine.widgets.grid.PickerFilter = Ext.extend(Tine.widgets.grid.FilterModel, {
    /**
     * @property Tine.Tinebase.Application app
     */
    app: null,
    
    /**
     * @cfg field
     * @type String
     */
    field: '',

    /**
     * @cfg defaultOperator
     * @type String
     */
    defaultOperator: 'in',

    /**
     * @cfg defaultValue
     * @type String
     */
    defaultValue: '',

    /**
     * @cfg label
     * @type String
     */
    label: '',

    /**
     * @cfg filterValueWidth
     * @type Integer
     */
    filterValueWidth: 200,

    /**
     * @cfg multiselectField
     */
    multiselectFieldConfig: null,
    
    /**
     * record picker
     * 
     * @type Tine.Tinebase.widgets.form.RecordPickerComboBox
     */
    picker: null,
    
    /**
     * @private
     */
    initComponent: function() {
        this.operators = this.operators || ['equals', 'not', 'in', 'notin'];
        this.multiselectFieldConfig = this.multiselectFieldConfig || {};
        
        // TODO invent a picker registry
        if (this.picker === null) {
            this.picker = (this.recordClass == Tine.Addressbook.Model.Contact) ?  Tine.Addressbook.SearchCombo : Tine.Tinebase.widgets.form.RecordPickerComboBox;
        }
        
        Tine.widgets.grid.PickerFilter.superclass.initComponent.call(this);
    },
    
    /**
     * called on operator change of a filter row
     * @private
     * 
     * TODO keep value widget if old operator / new operator use the same widget?
     */
    onOperatorChange: function(filter, newOperator, keepValue) {

        Tine.widgets.grid.PickerFilter.superclass.onOperatorChange.apply(this, arguments);
        
        var el = Ext.select('tr[id=' + this.ftb.frowIdPrefix + filter.id + '] td[class^=tw-ftb-frow-value]', this.ftb.el).first();
        
        // NOTE: removeMode got introduced on ext3.1 but is not docuemented
        //       'childonly' is no ext mode, we just need something other than 'container'
        if (filter.formFields.value && Ext.isFunction(filter.formFields.value.destroy)) {
            filter.formFields.value.removeMode = 'childsonly';
            filter.formFields.value.destroy();
            delete filter.formFields.value;
        }
        
        filter.formFields.value = this.valueRenderer(filter, el);
    },
    
    /**
     * value renderer
     * 
     * @param {Ext.data.Record} filter line
     * @param {Ext.Element} element to render to 
     */
    valueRenderer: function(filter, el) {
        if (filter.formFields.value) {
            return filter.formFields.value;
        }

        var operator = filter.get('operator') ? filter.get('operator') : this.defaultOperator,
            value;
            
        Tine.log.debug('Tine.widgets.grid.PickerFilter::valueRenderer() - Creating new value field for ' + operator + ' operator.')

        switch(operator) {
            case 'equals':
            case 'not':
                value = this.getPicker(filter, el);
                break;
            default:
                value = this.getPickerGridLayerCombo(filter, el);
        }

        value.on('specialkey', function(field, e){
             if(e.getKey() == e.ENTER){
                 this.onFiltertrigger();
             }
        }, this);
        value.on('select', this.onFiltertrigger, this);
        
        return value;
    },
    
    /**
     * get record picker
     * 
     * @param {Ext.data.Record} filter line
     * @param {Ext.Element} element to render to 
     * 
     */
    getPicker: function(filter, el) {
        Tine.log.debug('Tine.widgets.grid.PickerFilter::getPicker()');
        
        var result = new this.picker ({
            recordClass: this.recordClass,
            filter: filter,
            blurOnSelect: true,
            width: this.filterValueWidth,
//            listWidth: 500,
//            listAlign: 'tr-br',
            id: 'tw-ftb-frow-valuefield-' + filter.id,
            value: filter.data.value ? filter.data.value : this.defaultValue,
            renderTo: el
        });
        
        result.origSetValue = result.setValue.createDelegate(result);
        
        return result;
    },

    /**
     * get picker grid layer combo
     * 
     * @param {Ext.data.Record} filter line
     * @param {Ext.Element} element to render to 
     * 
     */
    getPickerGridLayerCombo: function(filter, el) {
        return new Tine.widgets.grid.PickerFilterValueField(Ext.apply({
            app: this.app,
            filter: filter,
            width: this.filterValueWidth,
            id: 'tw-ftb-frow-valuefield-' + filter.id,
            value: filter.data.value ? filter.data.value : this.defaultValue,
            renderTo: el
        }, this.multiselectFieldConfig));
    }
});

Tine.widgets.grid.FilterToolbar.FILTERS['tinebase.multiselect'] = Tine.widgets.grid.PickerFilter;

/**
 * @namespace   Tine.widgets.grid
 * @class       Tine.widgets.grid.PickerFilterValueField
 * @extends     Ext.ux.form.LayerCombo
 */
Tine.widgets.grid.PickerFilterValueField = Ext.extend(Ext.ux.form.LayerCombo, {
    hideButtons: false,
    formConfig: {
        labelAlign: 'left',
        labelWidth: 30
    },
    labelField: 'name',
    recordClass: null,
    valueStore: null,

    selectionWidget: null,
    labelRenderer: Ext.emptyFn,
    
    /**
     * init
     */
    initComponent: function() {
        this.on('beforecollapse', this.onBeforeCollapse, this);
        if (! this.store) {
            this.store = new Ext.data.SimpleStore({
                fields: this.recordClass
            });
        }
        
        Tine.widgets.grid.PickerFilterValueField.superclass.initComponent.call(this);
    },
    
    /**
     * get form values
     * 
     * @return {Array}
     */
    getFormValue: function() {
        var values = [];

        this.store.each(function(record) {
            values.push(record.data);
        }, this);            
        
        return values;
    },
    
    /**
     * get items
     * 
     * @return {Array}
     */
    getItems: function() {
        var items = [];

        this.initSelectionWidget();
        
        // defeat scoping :)
        selectionWidget = this.selectionWidget;
        
        this.pickerGridPanel = new Tine.widgets.grid.PickerGridPanel({
            height: this.layerHeight || 'auto',
            recordClass: this.recordClass,
            store: this.store,
            autoExpandColumn: this.labelField,
            getColumnModel: this.getColumnModel.createDelegate(this),
            initActionsAndToolbars: function() {
                Tine.widgets.grid.PickerGridPanel.prototype.initActionsAndToolbars.call(this);
                this.tbar = new Ext.Toolbar({
                    layout: 'fit',
                    items: [ selectionWidget ]
                });
            }
        });
        
        items.push(this.pickerGridPanel);
        
        return items;
    },
    
    /**
     * init selection widget
     */
    initSelectionWidget: function() {
        this.selectionWidget.on('select', this.onRecordSelect, this);
    },
    
    /**
     * @return Ext.grid.ColumnModel
     */
    getColumnModel: function() {
        var labelColumn = {id: this.labelField, header: String.format(_('Selected  {0}'), this.recordClass.getMeta('recordsName')), dataIndex: this.labelField};
        if (this.labelRenderer != Ext.emptyFn) {
            labelColumn.renderer = this.labelRenderer;
        }
        
        return new Ext.grid.ColumnModel({
            defaults: {
                sortable: false
            },
            columns:  [ labelColumn ]
        });
    },
    
    /**
     * record select
     * 
     * @param {String} field
     * @param {Object} recordData
     */
    onRecordSelect: function(field, recordData) {
        this.addRecord(recordData);        
        this.selectionWidget.clearValue();
    },
    
    /**
     * adds record from selection widget to store
     * 
     * @param {Object} recordData
     */
    addRecord: function(recordData) {
        var data = (recordData.data) ? recordData.data : recordData.attributes ? recordData.attributes : recordData;
        
        var existingRecord = this.store.getById(recordData.id);
        if (! existingRecord) {
            
            this.store.add(new Tine.Tinebase.Model.Container(data));
            
        } else {
            var idx = this.store.indexOf(existingRecord);
            var row = this.pickerGridPanel.getView().getRow(idx);
            Ext.fly(row).highlight();
        }
        
        this.selectionWidget.selectPanel.close();
    },
    
    /**
     * @param {String} value
     * @return {Ext.form.Field} this
     */
    setValue: function(value) {
        value = Ext.isArray(value) ? value : [value];
        
        var recordText = [];
        this.currentValue = [];
        
        this.store.removeAll();
        var record, id, text;
        for (var i=0; i < value.length; i++) {
            text = this.getRecordText(value[i]);
            if (text && text !== '') {
                recordText.push(text);
            }
        }
        
        this.setRawValue(recordText.join(', '));
        
        return this;
    },
    
    /**
     * get text from record defined by value (id or something else)
     * 
     * @param {String|Object} value
     * @return {String}
     */
    getRecordText: function(value) {
        var text = '',
            id = (Ext.isString(value)) ? value : value.id,
            record = (this.valueStore) ? this.valueStore.getById(id) : null;
            
        Tine.log.debug('Tine.widgets.grid.PickerFilterValueField::getRecordText');
        Tine.log.debug(value);
            
        if (record) {
            this.currentValue.push(record.id);
            // always copy/clone record because it can't exist in 2 different stores
            this.store.add(record.copy());
            text = record.get(this.labelField);
            text = (this.labelRenderer != Ext.emptyFn) ? this.labelRenderer(text) : text;
        }
        
        return text;
    },
    
    /**
     * cancel collapse if ctx menu or record selection is shown
     * 
     * @return Boolean
     */
    onBeforeCollapse: function() {
        if (this.pickerGridPanel) {
            var contextMenuVisible = this.pickerGridPanel.contextMenu && ! this.pickerGridPanel.contextMenu.hidden,
                selectionVisible = this.isSelectionVisible();
            
            return ! (contextMenuVisible || selectionVisible);
        } else {
            return true;
        }
    },
    
    /**
     * is selection visible ?
     * - overwrite this when extending to make sure that the selection widget is no longer visible on collapse
     * 
     * @return {Boolean}
     */
    isSelectionVisible: function() {
        return false;
    }
});
