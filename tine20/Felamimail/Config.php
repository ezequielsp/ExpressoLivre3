<?php
/**
 * @package     Felamimail
 * @subpackage  Config
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2012 Metaways Infosystems GmbH (http://www.metaways.de)
 */

/**
 * Felamimail config class
 * 
 * @package     Felamimail
 * @subpackage  Config
 */
class Felamimail_Config extends Tinebase_Config_Abstract
{
    /**
     * id of (filsystem) container for vacation templates
     * 
     * @var string
     */
    const VACATION_TEMPLATES_CONTAINER_ID = 'vacationTemplatesContainerId';
    
    /**
     * (non-PHPdoc)
     * @see tine20/Tinebase/Config/Definition::$_properties
     */
    protected static $_properties = array(
        self::VACATION_TEMPLATES_CONTAINER_ID => array(
        //_('Vacation Templates Container ID')
            'label'                 => 'Vacation Templates Container ID',
            'description'           => 'Vacation Templates Container ID',
            'type'                  => 'string',
            'clientRegistryInclude' => FALSE,
            'setByAdminModule'      => FALSE,
            'setBySetupModule'      => FALSE,
        ),
    );
    
    /**
     * (non-PHPdoc)
     * @see tine20/Tinebase/Config/Abstract::$_appName
     */
    protected $_appName = 'Felamimail';
    
    /**
     * holds the instance of the singleton
     *
     * @var Tinebase_Config
     */
    private static $_instance = NULL;
    
    /**
     * the constructor
     *
     * don't use the constructor. use the singleton 
     */    
    private function __construct() {}
    
    /**
     * the constructor
     *
     * don't use the constructor. use the singleton 
     */    
    private function __clone() {}
    
    /**
     * Returns instance of Tinebase_Config
     *
     * @return Tinebase_Config
     */
    public static function getInstance() 
    {
        if (self::$_instance === NULL) {
            self::$_instance = new self();
        }
        
        return self::$_instance;
    }
    
    /**
     * (non-PHPdoc)
     * @see tine20/Tinebase/Config/Abstract::getProperties()
     */
    public static function getProperties()
    {
        return self::$_properties;
    }
}
