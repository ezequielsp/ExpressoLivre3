<?php
/**
 * Tine 2.0

 * @package     HumanResources
 * @subpackage  Model
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @copyright   Copyright (c) 2012-2013 Metaways Infosystems GmbH (http://www.metaways.de)
 */

/**
 * class to hold Contract data
 *
 * @package     HumanResources
 * @subpackage  Model
 */
class HumanResources_Model_Contract extends Tinebase_Record_Abstract
{
    /**
     * holds the configuration object (must be set in the concrete class)
     *
     * @var Tinebase_ModelConfiguration
     */
    protected static $_configurationObject;
    
    /**
     * Holds the model configuration
     *
     * @var array
     */
    protected static $_modelConfiguration = array(
        'recordName'      => 'Contract', // _('Contract')
        'recordsName'     => 'Contracts', // _('Contracts')
        'hasRelations'    => FALSE,
        'hasCustomFields' => FALSE,
        'hasNotes'        => FALSE,
        'hasTags'         => FALSE,
        'modlogActive'    => TRUE,
        'containerProperty' => NULL,
        'createModule'    => FALSE,
        'isDependent'     => TRUE,
        'appName'         => 'HumanResources',
        'modelName'       => 'Contract',
        'fields'          => array(
            'employee_id'       => array(
                'label'      => 'Employee',    // _('Employee')
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => FALSE),
                'type'       => 'record',
                'config' => array(
                    'appName'     => 'HumanResources',
                    'modelName'   => 'Employee',
                    'idProperty'  => 'id',
                    'isParent'    => TRUE
                )
            ),
            'start_date'        => array(
                'label'      => 'Start Date',    // _('Start Date')
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => TRUE),
                'type'       => 'date',
                 'default'    => 'now',
                 'showInDetailsPanel' => TRUE
            ),
            'end_date'          => array(
                'validators' => array(Zend_Filter_Input::ALLOW_EMPTY => TRUE),
                'label'   => 'End Date',    // _('End Date')
                'type'    => 'date',
                'showInDetailsPanel' => TRUE
            ),
            'vacation_days'     => array(
                'label'   => 'Vacation Days',    // _('Vacation Days')
                'type'    => 'integer',
                'default' => 23,
                'queryFilter' => TRUE,
                'showInDetailsPanel' => TRUE
            ),
            'feast_calendar_id' => array(
                'label' => 'Feast Calendar',    // _('Feast Calendar')
                'type'  => 'container',
                'config' => array(
                    'appName'   => 'Calendar',
                    'modelName' => 'Event',
                ),
                'showInDetailsPanel' => TRUE
            ),
            'workingtime_json'  => array(
                'label'   => 'Workingtime', // _('Workingtime')
                'default' => '{"days": [8,8,8,8,8,0,0]}',
                'showInDetailsPanel' => TRUE
            )
        )
    );
}
