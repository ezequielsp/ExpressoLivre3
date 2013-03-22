<?php
/**
 * Tine 2.0
 *
 * @package     Calendar
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @copyright   Copyright (c) 2012-2013 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

/**
 * class for Calendar initialization
 *
 * @package     Setup
 */
class Admin_Setup_DemoData extends Tinebase_Setup_DemoData_Abstract
{
    /**
     * holdes the instance of the singleton
     *
     * @var Admin_Setup_DemoData
     */
    private static $_instance = NULL;

    /**
     * the constructor
     *
     */
    public function __construct()
    {
    }

    /**
     * maps contact data for the personas
     */
    protected $_dataMapping = array(
        'sclever'  => array(
            'email_home' => 'minni.mouse@mailforyouandme.uk', 'tel_work' => '+441273-3766-373', 'salutation' => 'MS', 'tel_cell' => '+441273-23462111', 'tel_cell_private' => '+441273-853642436', 'tel_fax' => '+441273-3766-12', 'tel_home' => '+441273-23434521'
        ),
        'rwright'  => array(
            'email_home' => 'robertatis@mailforyouandme.uk','tel_work' => '+441273-3766-374', 'salutation' => 'MS', 'tel_cell' => '+441273-123587899', 'tel_cell_private' => '+441273-543236', 'tel_fax' => '+441273-3766-13', 'tel_home' => '+441273-98675333'
        ),
        'pwulf'    => array(
            'email_home' => 'masterchief@mailforyouandme.uk', 'tel_work' => '+441273-3766-376', 'tel_cell' => '+441273-23545265', 'tel_cell_private' => '+441273-345677', 'tel_fax' => '+441273-3766-15', 'tel_home' => '+441273-12566'
        ),
        'jmcblack' => array(
            'email_home' => 'full.house@mailforyouandme.uk', 'tel_work' => '+441273-3766-377', 'tel_cell' => '+441273-24353676', 'tel_cell_private' => '+441273-987643', 'tel_fax' => '+441273-3766-16', 'tel_home' => '+441273-335662'
        ),
        'jsmith'   => array(
            'email_home' => 'johnny@mailforyouandme.uk', 'tel_work' => '+441273-3766-378', 'tel_cell' => '+441273-98765443', 'tel_cell_private' => '+441273-236734', 'tel_fax' => '+441273-3766-17', 'tel_home' => '+441273-2354999'
        ),
        'default'  => array(
            'salutation' => 'MR', 'org_name' => 'Tine Publications, Ltd', 'adr_one_locality' => 'Brighton',
            'adr_one_region' => 'East Sussex', 'adr_one_postalcode' => 'BN1', 
            'adr_one_street' => 'Montgomery Street 589', 'adr_one_countryname' => 'GB'
        )
    );

    /**
     * the singleton pattern
     *
     * @return Admin_Setup_DemoData
     */
    public static function getInstance()
    {
        if (self::$_instance === NULL) {
            self::$_instance = new Admin_Setup_DemoData;
        }

        return self::$_instance;
    }

    /**
     * creates the groups if not created already
     */
    protected function _createGroups()
    {
        $fe = new Admin_Frontend_Json();
        foreach($this->_groups as $groupArray) {
            $members = array();
            foreach($groupArray['groupMembers'] as $member) {
                $members[] = $this->_personas[$member]->getId();
            }
            
            $this->_groups[$groupArray['groupData']['name']] = $fe->saveGroup($groupArray['groupData'], $members);
        }
    }
    
    /**
     * create roles
     */
    protected function _createRoles()
    {
        $fe = new Admin_Frontend_Json();
        foreach($this->_roles as $roleArray) {
            
            // resolve members
            $members = array();
            foreach($roleArray['roleMembers'] as &$member) {
                $member['id'] = $this->_groups[$member['name']]['id'];
                unset($member['name']);
            }
            
            // resolve rights
            $roleRights = array();
            foreach($roleArray['roleRights'] as $application => $rights) {
                $appId = Tinebase_Application::getInstance()->getApplicationByName($application)->getId();
                foreach($rights as $rightName) { 
                    $roleRights[] = array('application_id' => $appId, 'right' => $rightName);
                }
            }
            
            try {
                $result = $fe->saveRole($roleArray['roleData'], $roleArray['roleMembers'], $roleRights);
            } catch (Exception $e) {
                echo 'Role "' . $roleArray['roleData']['name'] . '" already exists. Skipping...' . PHP_EOL;
            }
        }
    }

    /**
     * @see Tinebase_Setup_DemoData_Abstract
     */
    protected function _beforeCreate()
    {
        $be = new Addressbook_Backend_Sql();
        
        foreach ($this->_personas as $login => $fullName) {
            try {
                $user = Tinebase_User::getInstance()->getFullUserByLoginName($login);
                $contact = Addressbook_Controller_Contact::getInstance()->get($user->contact_id);
            } catch (Tinebase_Exception_NotFound $e) {
                list($given, $last) = explode(' ', $fullName);

                $group   = Tinebase_Group::getInstance()->getGroupByName('Users');
                $groupId = $group->getId();

                $user = new Tinebase_Model_FullUser(array(
                    'accountLoginName'      => $login,
                    'accountPrimaryGroup'   => $groupId,
                    'accountDisplayName'    => $fullName,
                    'accountLastName'       => $last,
                    'accountFirstName'      => $given,
                    'accountFullName'       => $fullName,
                    //'accountEmailAddress'   => $login . '@tine-publications.co.uk',
                    'accountEmailAddress'   => $login . '@tine20.org'
                ));

                if (Tinebase_Application::getInstance()->isInstalled('Addressbook') === true) {
                    $internalAddressbook = Tinebase_Container::getInstance()->getContainerByName('Addressbook', 'Internal Contacts', Tinebase_Model_Container::TYPE_SHARED);

                    $user->container_id = $internalAddressbook->getId();

                    $contact = Admin_Controller_User::getInstance()->createOrUpdateContact($user);
                    
                    $user->contact_id = $contact->getId();
                }

                $user = Tinebase_User::getInstance()->addUser($user);

                Tinebase_Group::getInstance()->addGroupMember($groupId, $user);

                if (Tinebase_Application::getInstance()->isInstalled('Addressbook') === true) {
                    $listBackend = new Addressbook_Backend_List();

                    $listBackend->addListMember($group->list_id, $user->contact_id);
                }

                // give additional testusers the same password as the primary test account
                try {
                    $testconfig = Zend_Registry::get('testConfig');
                    Tinebase_User::getInstance()->setPassword($user, $testconfig->password);
                } catch (Zend_Exception $e) {
                    Tinebase_User::getInstance()->setPassword($user, static::$_defaultPassword);
                }
            }
            
            if (Tinebase_Application::getInstance()->isInstalled('Addressbook') === true) {
                $ar = array_merge($this->_dataMapping[$login], $this->_dataMapping['default']);
                $filename = dirname(__FILE__) . DIRECTORY_SEPARATOR . 'DemoData' . DIRECTORY_SEPARATOR . 'persona_' . $login . '.jpg';
                if (file_exists($filename)) {
                    $handle = fopen($filename, "r");
                    $content = fread($handle, filesize($filename));
                    fclose($handle);
                    $be->_saveImage($contact->getId(), $content);
                    
                }
                foreach($ar as $property => $value) {
                    $contact->{$property} = $value;
                }
                
                Addressbook_Controller_Contact::getInstance()->update($contact);
            }
            
            $this->_personas[$login] = $user;
        }
        
        $this->_createGroups();
        $this->_createRoles();
    }
}
