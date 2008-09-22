<?php
/**
 * Tine 2.0
 * 
 * @package     Phone
 * @license     http://www.gnu.org/licenses/agpl.html AGPL3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2008 Metaways Infosystems GmbH (http://www.metaways.de)
 * @version     $Id:Asterisk.php 4159 2008-09-02 14:15:05Z p.schuele@metaways.de $
 *
 */

/**
 * call history backend for the Phone application
 * 
 * @package     Phone
 * @subpackage  Snom
 * 
 */
class Phone_Backend_Snom_Callhistory extends Tinebase_Abstract_SqlTableBackend
{
    /**
     * don't clone. Use the singleton.
     *
     */
    private function __clone() {}

    /**
     * holdes the instance of the singleton
     *
     * @var Phone_Backend_Snom_Callhistory
     */
    private static $_instance = NULL;
    
    /**
     * the singleton pattern
     *
     * @return Phone_Backend_Snom_Callhistory
     */
    public static function getInstance() 
    {
        if (self::$_instance === NULL) {
            self::$_instance = new Phone_Backend_Snom_Callhistory();
        }
        
        return self::$_instance;
    }

    /**
     * the constructor
     * 
     * don't use the constructor. use the singleton 
     */
    private function __construct ()
    {
        $this->_tableName = SQL_TABLE_PREFIX . 'phone_callhistory';
        $this->_modelName = 'Phone_Model_Call';
        $this->_db = Zend_Registry::get('dbAdapter');
        $this->_table = new Tinebase_Db_Table(array('name' => $this->_tableName));
    }    

    /************************ search functions ****************************/
    
    /**
     * Search for calls matching given filter
     *
     * @param Phone_Model_CallFilter $_filter
     * @param Tinebase_Model_Pagination $_pagination
     * @return Tinebase_Record_RecordSet
     * 
     * @todo move to Tinebase_Abstract_SqlTableBackend
     */
    public function search(Phone_Model_CallFilter $_filter, Tinebase_Model_Pagination $_pagination)
    {
        $set = new Tinebase_Record_RecordSet('Phone_Model_Call');
        
        if ($_pagination === NULL) {
            $_pagination = new Tinebase_Model_Pagination();
        }
        
        // build query
        $select = $this->_getSelect();
        
        if (!empty($_pagination->limit)) {
            $select->limit($_pagination->limit, $_pagination->start);
        }
        if (!empty($_pagination->sort)) {
            $select->order($_pagination->sort . ' ' . $_pagination->dir);
        }        
        $this->_addFilter($select, $_filter);
                
        // get records
        $stmt = $this->_db->query($select);
        $rows = $stmt->fetchAll(Zend_Db::FETCH_ASSOC);
        foreach ($rows as $row) {
            $record = new Phone_Model_Call($row, true, true);
            $set->addRecord($record);
        }
        
        return $set;
    }
    
    /**
     * Gets total count of search with $_filter
     * 
     * @param Phone_Model_CallFilter $_filter
     * @return int
     * 
     * @todo move to Tinebase_Abstract_SqlTableBackend
     */
    public function searchCount(Phone_Model_CallFilter $_filter)
    {        
        $select = $this->_getSelect(TRUE);
        $this->_addFilter($select, $_filter);
        $result = $this->_db->fetchOne($select);
        return $result;        
    }    

    /************************ create / update calls ****************************/
    
    /**
     * start phone call and save in history
     *
     * @param Phone_Model_Call $_call
     * @return Phone_Model_Call
     */
    public function startCall(Phone_Model_Call $_call) {
        if ( empty($_call->id) ) {
            $newId = $_call->generateUID();
            $_call->setId($newId);
        }
        
        $_call->start = Zend_Date::now()->getIso();
        
        $call = $this->create($_call);
        
        return $call;
    }
    
    /**
     * update call, set ringing time
     *
     * @param Phone_Model_Call $_call
     * @return Phone_Model_Call
     */
    public function connected(Phone_Model_Call $_call)
    {
        $now = Zend_Date::now();
        $_call->connected = $now->getIso();
        $_call->ringing = $now->sub($_call->start);
        
        $call = $this->update($_call);
        
        return $call;
    }

    /**
     * update call, set duration
     *
     * @param Phone_Model_Call $_call
     * @return Phone_Model_Call
     */
    public function disconnected(Phone_Model_Call $_call)
    {
        $now = Zend_Date::now();
        $_call->disconnected = $now->getIso();
        $_call->duration = $now->sub($_call->connected);
        
        $call = $this->update($_call);
        
        return $call;
    }
    
    /*********************** helper functions ***********************/
    
    /**
     * get the basic select object to fetch calls from the database 
     * @param $_getCount only get the count
     *
     * @return Zend_Db_Select
     */
    protected function _getSelect($_getCount = FALSE)
    {        
        if ($_getCount) {
            $fields = array('count' => 'COUNT(*)');    
        } else {
            $fields = array(
                'id',
                'line_id',
                'phone_id',
                'call_id',
                'start',
                'connected',
                'disconnected',
                'duration',
                'ringing',
                'direction',
                'source',
                'destination'    
            );
        }

        $select = $this->_db->select()
            ->from(array('calls' => SQL_TABLE_PREFIX . 'phone_callhistory'), $fields);
        
        return $select;
    }
    
    /**
     * add the fields to search for to the query
     *
     * @param  Zend_Db_Select           $_select current where filter
     * @param  Phone_Model_CallFilter   $_filter the string to search for
     * @return void
     */
    protected function _addFilter(Zend_Db_Select $_select, Phone_Model_CallFilter $_filter)
    {
                        
        if (!empty($_filter->query)) {
            $_select->where($this->_db->quoteInto('(calls.source LIKE ? OR calls.destination LIKE ?)', '%' . $_filter->query . '%'));
        }
        
        /*
        $_select->where($this->_db->quoteInto('lead.container IN (?)', $_filter->container));

        if (!empty($_filter->leadstate)) {
            $_select->where($this->_db->quoteInto('lead.leadstate_id = ?', $_filter->leadstate));
        }
        if (!empty($_filter->probability)) {
            $_select->where($this->_db->quoteInto('lead.probability >= ?', (int)$_filter->probability));
        }
        if (isset($_filter->showClosed) && $_filter->showClosed){
            // nothing to filter
        } else {
            $_select->where('end IS NULL');
        }
        */
    }        
    
}
