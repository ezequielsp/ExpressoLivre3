<?php
/**
 * ExampleRecord controller for Webconference application
 * 
 * @package     Webconference
 * @subpackage  Controller
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2007-2009 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

/**
 * ExampleRecord controller class for Webconference application
 * 
 * @package     Webconference
 * @subpackage  Controller
 */
class Webconference_Controller_WebconferenceConfig extends Tinebase_Controller_Record_Abstract
{
    /**
     * the constructor
     *
     * don't use the constructor. use the singleton 
     */
    private function __construct() {        
        $this->_applicationName = 'Webconference';
        $this->_modelName       = 'Webconference_Model_WebconferenceConfig';
        $this->_backend = new Webconference_Backend_WebconferenceConfig();
        $this->_currentAccount = Tinebase_Core::getUser();   
        $this->_purgeRecords = FALSE;
        // activate this if you want to use containers
        $this->_doContainerACLChecks = FALSE;
    }    
    
    /**
     * holds the instance of the singleton
     *
     * @var Webconference_Controller_ExampleRecord
     */
    private static $_instance = NULL;
    
    /**
     * the singleton pattern
     *
     * @return Webconference_Controller_ExampleRecord
     */
    public static function getInstance() 
    {
        if (self::$_instance === NULL) {
            self::$_instance = new Webconference_Controller_WebconferenceConfig();
        }
        
        return self::$_instance;
    }        

    /****************************** overwritten functions ************************/    

    public function saveWebconferenceConfig($recordData){
       $recordData = (object) $recordData;
       
       $configArray = $this->_backend->getAll();//->toArray();
       
       if(count($configArray) > 0)
       {
           $config = $configArray[0];
           $config->url = $recordData->url;
           $config->salt = $recordData->salt;
           $config->description = $recordData->description;
           
           return $this->update($config);
       }
       else
       {
           $config = new Webconference_Model_WebconferenceConfig(
                   array(
                       'url' => $recordData->url,
                       'salt'=> $recordData->salt,
                       'description'=> $recordData->description
                   )
                   //,true
                   );

           return $this->create($config);
           
       }
       
    }
    public function loadWebconferenceConfig()
    {
        $configArray = $this->_backend->getAll()->toArray();
        
        if(count($configArray) > 0)
        {
            //throw new Tinebase_Exception_UnexpectedValue('----size: '.count($configArray));
            return $configArray[0];
        }
        else
        {
            $config = new Webconference_Model_WebconferenceConfig(
                    array(
                        'url' => '',
                        'salt'=> '',
                        'description' => ''
                    ),
                    true
                    );
            
            return $config->toArray();
        }
    }
}
