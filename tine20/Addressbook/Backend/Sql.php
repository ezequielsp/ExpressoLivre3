<?php
/**
 * Tine 2.0
 *
 * @package     Addressbook
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Lars Kneschke <l.kneschke@metaways.de>
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 * @version     $Id$
 * 
 * @todo use functions from Tinebase_Abstract_SqlTableBackend
 */

/**
 * sql backend class for the addressbook
 *
 * @package     Addressbook
 */
class Addressbook_Backend_Sql extends Tinebase_Abstract_SqlTableBackend
{
    /**
     * the constructor
     *
     * don't use the constructor. use the singleton 
     */
    private function __construct ()
    {
        $this->_db = Zend_Registry::get('dbAdapter');
        $this->_tableName = SQL_TABLE_PREFIX . 'addressbook';
        $this->_modelName = 'Addressbook_Model_Contact';
        $this->_table = new Tinebase_Db_Table(array('name' => $this->_tableName));        
    }

    /**
     * don't clone. Use the singleton.
     *
     */
    private function __clone ()
    {
    }

    /**
     * holdes the instance of the singleton
     *
     * @var Addressbook_Backend_Sql
     */
    private static $_instance = NULL;
    
    /**
     * the singleton pattern
     *
     * @return Addressbook_Backend_Sql
     */
    public static function getInstance ()
    {
        if (self::$_instance === NULL) {
            self::$_instance = new Addressbook_Backend_Sql();
        }
        return self::$_instance;
    }    

        
    /**
     * add a contact
     *
     * @param Addressbook_Model_Contact $_contactData the contactdata
     * @return Addressbook_Model_Contact
     * @deprecated
     * @todo replace by create function from SqlTableBackend 
     */
    public function create(Addressbook_Model_Contact $_contactData)
    {
        if (! $_contactData->isValid()) {
            throw new Exception('invalid contact');
        }
        $contactData = $_contactData->toArray();
        if (empty($_contactData->id)) {
            unset($contactData['id']);
        }
        // tags and notes are not property of this backend
        unset($contactData['tags']);
        unset($contactData['notes']);
        
        $this->_db->insert(SQL_TABLE_PREFIX . 'addressbook', $contactData);
        $id = $this->_db->lastInsertId(SQL_TABLE_PREFIX . 'addressbook', 'id');
        // if we insert a contact without an id, we need to get back one
        if (empty($_contactData->id) && $id == 0) {
            throw new Exception("returned contact id is 0");
        }
        // if the account had no accountId set, set the id now
        if (empty($_contactData->id)) {
            $_contactData->id = $id;
        }
        return $this->get($_contactData->id);
    }
    
    /**
     * update an existing contact
     *
     * @param Addressbook_Model_Contact $_contactData the contactdata
     * @return Addressbook_Model_Contact
     * @deprecated
     * @todo replace by update function from SqlTableBackend 
     */
    public function update(Addressbook_Model_Contact $_contactData)
    {
        if (! $_contactData->isValid()) {
            throw new Exception('invalid contact');
        }
        $contactId = Addressbook_Model_Contact::convertContactIdToInt($_contactData);
        $contactData = $_contactData->toArray();
        unset($contactData['id']);
        // tags are not property of this backend
        unset($contactData['tags']);
        unset($contactData['notes']);
        $where = array($this->_db->quoteInto('id = ?', $contactId));
        $this->_db->update(SQL_TABLE_PREFIX . 'addressbook', $contactData, $where);
        return $this->get($contactId);
    }

    /**
     * Returns a set of contacts identified by their id's
     * 
     * @param  array $_ids array of int
     * @return Tinebase_Record_RecordSet of Addressbook_Model_Contact
     * @deprecated
     * @todo replace by getMultiple function from SqlTableBackend 
     */
    public function getMultiple(array $_contactIds)
    {
        $contacts = new Tinebase_Record_RecordSet('Addressbook_Model_Contact');
        
        if (!empty($_contactIds)) {
            $select = $this->_db->select()->from(SQL_TABLE_PREFIX . 'addressbook')->where($this->_db->quoteInto('id IN (?)', $_contactIds));
            $stmt = $this->_db->query($select);
            $contactsArray = $stmt->fetchAll(Zend_Db::FETCH_ASSOC);
            
            foreach ($contactsArray as $contact) {
                $contacts->addRecord(new Addressbook_Model_Contact($contact));
            }
        }
        return $contacts;
    }
    
    /**
     * delete contact identified by contact id
     *
     * @param int $_contactId contact ids
     * @return int the number of rows deleted
     * 
     * @deprecated
     * @todo replace by delete function from SqlTableBackend 
     */
    public function delete ($_contactId)
    {
        $contactId = Addressbook_Model_Contact::convertContactIdToInt($_contactId);
        $where = array($this->_db->quoteInto('id = ?', $contactId) , $this->_db->quoteInto('id = ?', $contactId));
        $result = $this->_db->delete(SQL_TABLE_PREFIX . 'addressbook', $where);
        return $result;
    }
    
    /**
     * add the fields to search for to the query
     *
     * @param  Zend_Db_Select           $_select current where filter
     * @param  Addressbook_Model_ContactFilter $_filter the string to search for
     * @return void
     */
    protected function _addFilter (Zend_Db_Select $_select, Addressbook_Model_ContactFilter $_filter)
    {        
        $_select->where($this->_db->quoteInto('container_id IN (?)', $_filter->container));
        
        $_filter->appendFilterSql($_select);
    }
    
    /**
     * fetch one contact identified by contactid
     *
     * @param int $_userId
     * @return Addressbook_Model_Contact 
     * 
     * @todo add test
     */
    public function getByUserId($_userId)
    {
        $select = $this->_db->select()->from(SQL_TABLE_PREFIX . 'addressbook')->where($this->_db->quoteInto('account_id = ?', $_userId));
        $row = $this->_db->fetchRow($select);
        if (! $row) {
            throw new UnderflowException('contact with user id ' . $_userId . ' not found');
        }
        $result = new Addressbook_Model_Contact($row);
        return $result;
    }
    
}
