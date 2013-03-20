<?php
/**
 * class to hold InventoryItem data
 * 
 * @package     Inventory
 * @subpackage  Model
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Stefanie Stamer <s.stamer@metaways.de>
 * @copyright   Copyright (c) 2007-2013 Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 */

/**
 * class to hold InventoryItem data
 * 
 * @package     Inventory
 * @subpackage  Model
 */
class Inventory_Model_InventoryItem extends Tinebase_Record_Abstract
{
    /**
     * holds the configuration object (must be declared in the concrete class)
     *
     * @var Tinebase_ModelConfiguration
     */
    protected static $_configurationObject = NULL;
    
    /**
     * Holds the model configuration (must be assigned in the concrete class)
     *
     * @var array
     */
    protected static $_modelConfiguration = array(
        'recordName'        => 'Inventory item', // _('Inventory item') ngettext('Inventory item', 'Inventory items', n)
        'recordsName'       => 'Inventory items', // _('Inventory items')
        'containerProperty' => 'container_id',
        'titleProperty'     => 'name',
        'containerName'     => 'Inventory item list', // _('Inventory item list')
        'containersName'    => 'Inventory items lists', // _('Inventory items lists')
        'hasRelations'      => true,
        'hasCustomFields'   => true,
        'hasNotes'          => true,
        'hasTags'           => true,
        'useModlog'         => true,

        'createModule'    => true,

        'appName'         => 'Inventory',
        'modelName'       => 'InventoryItem',
        
        'fields'          => array(
            'name' => array(
                'validators'  => array(Zend_Filter_Input::ALLOW_EMPTY => false, 'presence' => 'required'),
                'label'       => 'Name', // _('Name')
                'queryFilter' => true
            ),
            'status' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label' => 'Status', // _('Status')
                'type' => 'keyfield',
                'name' => 'inventoryStatus',
                'default' => 'UNKNOWN'
            ),
            'inventory_id' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label'      => 'Inventory ID' // _('Inventory ID')
            ),
            'description' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label'      =>'Description' // _('Description')
            ),
            'location' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label'      => 'Location', // _('Location')
            ),
            'invoice_date' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label'      => 'Invoice date', // _('Invoice date')
                'hidden'     => TRUE,
                'default'    => NULL
            ),
            'total_number' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label'      => NULL,
                'inputFilters' => array('Zend_Filter_Empty' => NULL),
                'default'    => 1,
            ),
            'invoice' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label'      => 'Invoice', // _('Invoice')
                'hidden'     => TRUE
            ),
            'price' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label'      => 'Price', // _('Price')
                'hidden'     => TRUE,
                'inputFilters' => array('Zend_Filter_Empty' => NULL),
            ),
            'costcentre' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label'      => 'Cost centre', // _('Cost centre')
                'hidden'     => TRUE,
                'type'  => 'record',
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => TRUE, Zend_Filter_Input::DEFAULT_VALUE => NULL),
                'config' => array(
                    'appName'     => 'Sales',
                    'modelName'   => 'CostCenter',
                    'idProperty'  => 'id'
                )
            ),
            'warranty' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label'      => 'Warranty', // _('Warranty')
                'hidden'     => TRUE,
                'inputFilters' => array('Zend_Filter_Empty' => NULL),
            ),
            'added_date' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label'      => 'Item added', // _('Item added')
                'hidden'     => TRUE,
                'inputFilters' => array('Zend_Filter_Empty' => NULL),
            ),
            'removed_date' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label'      => 'Item removed', // _('Item removed')
                'hidden'     => TRUE,
                'inputFilters' => array('Zend_Filter_Empty' => NULL),
            ),
            'active_number' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true),
                'label'      => 'Available number', // _(Available number)
                'inputFilters' => array('Zend_Filter_Empty' => NULL),
                'default'    => 1,
            ),
            'depreciate_status' => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => true, Zend_Filter_Input::DEFAULT_VALUE => 0),
                //'label' => 'Depreciate', // _('Depreciate')
                'label'      => NULL,
                'inputFilters' => array('Zend_Filter_Empty' => NULL),
            ),
        )
     );
    
    /**
     * if foreign Id fields should be resolved on search and get from json
     * should have this format:
     *     array('Calendar_Model_Contact' => 'contact_id', ...)
     * or for more fields:
     *     array('Calendar_Model_Contact' => array('contact_id', 'customer_id), ...)
     * (e.g. resolves contact_id with the corresponding Model)
     *
     * @var array
     */
//     protected static $_resolveForeignIdFields = array(
//             'Sales_Model_CostCenter' => array('costcentre')
//     );
    
    /**
     * Returns every valid key to manage in Frontend/Json.php
     * 
     * @todo to be removed if we have a similiar function in the core
     * @param void
     * @return array
     */
    public static function getValidFields()
    {
        return static::$_configurationObject->fieldKeys;
    }
}
