<?php
/**
 * Tine 2.0
 *
 * @package     Inventory
 * @subpackage  Setup
 * @license     http://www.gnu.org/licenses/agpl.html AGPL3
 * @copyright   Copyright (c) 2012 Metaways Infosystems GmbH (http://www.metaways.de)
 * @author      Michael Spahn <m.spahn@metaways.de>
 */

/**
 * Inventory updates for version 6.x
 *
 * @package     Inventory
 * @subpackage  Setup
 */
class Inventory_Setup_Update_Release6 extends Setup_Update_Abstract
{
    /**
     * Rename old keyfield type to status
     */
    public function update_0()
    {
        $field = '<field>
                    <name>status</name>
                    <type>text</type>
                    <length>40</length>
                </field>';
        
        $declaration = new Setup_Backend_Schema_Field_Xml($field);
        $this->_backend->alterCol('inventory_item', $declaration, 'type');
        
        $this->setApplicationVersion('Inventory', '6.1');
        $this->setTableVersion('inventory_item', '2');
    }
    
     /**
     * Delete depreciation and amortization column
     * Add depreciate_status
     * Rename add_time to invoice_date
     * Rename item_added to added_date and item_removed to removed_date
     * Update ExportDefinitions
     */
    public function update_1()
    {
        $this->_backend->dropCol('inventory_item', 'depreciation');
        $this->_backend->dropCol('inventory_item', 'amortization');
    
        $declaration = new Setup_Backend_Schema_Field_Xml('
            <field>
                <name>depreciate_status</name>
                <type>boolean</type>
                <default>false</default>
            </field>
        ');
        $this->_backend->addCol('inventory_item', $declaration, 16);
    
        $field = '
            <field>
                <name>invoice_date</name>
                <type>datetime</type>
                <notnull>false</notnull>
            </field>';
    
        $declaration = new Setup_Backend_Schema_Field_Xml($field);
        $this->_backend->alterCol('inventory_item', $declaration, 'add_time');
    
        $field = '
            <field>
                <name>added_date</name>
                <type>datetime</type>
            </field>';
    
        $declaration = new Setup_Backend_Schema_Field_Xml($field);
        $this->_backend->alterCol('inventory_item', $declaration, 'item_added');
    
        $field = '
            <field>
                <name>removed_date</name>
                <type>datetime</type>
            </field>';
    
        $declaration = new Setup_Backend_Schema_Field_Xml($field);
        $this->_backend->alterCol('inventory_item', $declaration, 'item_removed');
        
        Setup_Controller::getInstance()->createImportExportDefinitions(Tinebase_Application::getInstance()->getApplicationByName('Inventory'));
        
        $this->setApplicationVersion('Inventory', '6.2');
        $this->setTableVersion('inventory_item', '3');
    }
}
