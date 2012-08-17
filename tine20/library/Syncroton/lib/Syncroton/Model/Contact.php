<?php
/**
 * Syncroton
 *
 * @package     Syncroton
 * @subpackage  Model
 * @license     http://www.tine20.org/licenses/lgpl.html LGPL Version 3
 * @copyright   Copyright (c) 2012-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 * @author      Lars Kneschke <l.kneschke@metaways.de>
 */

/**
 * class to handle ActiveSync contact
 *
 * @package     Syncroton
 * @subpackage  Model
 * @property    string    Alias
 * @property    DateTime  Anniversary
 * @property    string    AssistantName
 * @property    string    AssistantPhoneNumber
 * @property    DateTime  Birthday
 * @property    string    Business2PhoneNumber
 * @property    string    BusinessAddressCity
 * @property    Syncroton_Model_EmailBody  Body
 */

class Syncroton_Model_Contact extends Syncroton_Model_AEntry
{
    protected $_xmlBaseElement = 'ApplicationData';
    
    protected $_properties = array(
        'AirSyncBase' => array(
            'Body'                   => array('type' => 'container')
        ),
        'Contacts' => array(
            'Alias'                  => array('type' => 'string'),
            'Anniversary'            => array('type' => 'datetime'),
            'AssistantName'          => array('type' => 'string'),
            'AssistantPhoneNumber'   => array('type' => 'string'),
            'Birthday'               => array('type' => 'datetime'),
            //'BodySize'              => 0x0a,
            //'BodyTruncated'         => 0x0b,
            'Business2PhoneNumber'   => array('type' => 'string'),
            'BusinessAddressCity'    => array('type' => 'string'),
            'BusinessAddressCountry' => array('type' => 'string'),
            'BusinessAddressPostalCode' => array('type' => 'string'),
            'BusinessAddressState'   => array('type' => 'string'),
            'BusinessAddressStreet'  => array('type' => 'string'),
            'BusinessFaxNumber'      => array('type' => 'string'),
            'BusinessPhoneNumber'    => array('type' => 'string'),
            'CarPhoneNumber'         => array('type' => 'string'),
            'Categories'             => array('type' => 'container', 'childName' => 'Category'),
            //'Category'              => array('type' => 'string'),
            'Children'               => array('type' => 'container', 'childName' => 'Child'),
            //'Child'                 => array('type' => 'string'),
            'CompanyName'            => array('type' => 'string'),
            'Department'             => array('type' => 'string'),
            'Email1Address'          => array('type' => 'string'),
            'Email2Address'          => array('type' => 'string'),
            'Email3Address'          => array('type' => 'string'),
            'FileAs'                 => array('type' => 'string'),
            'FirstName'              => array('type' => 'string'),
            'Home2PhoneNumber'       => array('type' => 'string'),
            'HomeAddressCity'        => array('type' => 'string'),
            'HomeAddressCountry'     => array('type' => 'string'),
            'HomeAddressPostalCode'  => array('type' => 'string'),
            'HomeAddressState'       => array('type' => 'string'),
            'HomeAddressStreet'      => array('type' => 'string'),
            'HomeFaxNumber'          => array('type' => 'string'),
            'HomePhoneNumber'        => array('type' => 'string'),
            'JobTitle'               => array('type' => 'string'),
            'LastName'               => array('type' => 'string'),
            'MiddleName'             => array('type' => 'string'),
            'MobilePhoneNumber'      => array('type' => 'string'),
            'OfficeLocation'         => array('type' => 'string'),
            'OtherAddressCity'       => array('type' => 'string'),
            'OtherAddressCountry'    => array('type' => 'string'),
            'OtherAddressPostalCode' => array('type' => 'string'),
            'OtherAddressState'      => array('type' => 'string'),
            'OtherAddressStreet'     => array('type' => 'string'),
            'PagerNumber'            => array('type' => 'string'),
            'Picture'                => array('type' => 'string', 'encoding' => 'base64'),
            'RadioPhoneNumber'       => array('type' => 'string'),
            'Rtf'                    => array('type' => 'string'),
            'Spouse'                 => array('type' => 'string'),
            'Suffix'                 => array('type' => 'string'),
            'Title'                  => array('type' => 'string'),
            'WebPage'                => array('type' => 'string'),
            'WeightedRank'           => array('type' => 'string'),
            'YomiCompanyName'        => array('type' => 'string'),
            'YomiFirstName'          => array('type' => 'string'),
            'YomiLastName'           => array('type' => 'string'),
        ),
        'Contacts2' => array(
            'AccountName'            => array('type' => 'string'),
            'CompanyMainPhone'       => array('type' => 'string'),
            'CustomerId'             => array('type' => 'string'),
            'GovernmentId'           => array('type' => 'string'),
            'IMAddress'              => array('type' => 'string'),
            'IMAddress2'             => array('type' => 'string'),
            'IMAddress3'             => array('type' => 'string'),
            'ManagerName'            => array('type' => 'string'),
            'MMS'                    => array('type' => 'string'),
            'NickName'               => array('type' => 'string'),
        )
    );
    
    protected function _parseContactsNamespace(SimpleXMLElement $properties)
    {
        // fetch data from Contacts namespace
        $children = $properties->children('uri:Contacts');
    
        foreach ($children as $elementName => $xmlElement) {
    
            switch ($elementName) {
                case 'Categories':
                    $categories = array();
                    
                    foreach ($xmlElement->Category as $category) {
                        $categories[] = (string) $category;
                    }
                    
                    $this->$elementName = $categories;
                    
                    break;
                    
                case 'Children':
                    $children = array();
                    
                    foreach ($xmlElement->Child as $child) {
                        $children[] = (string) $child;
                    }
                    
                    $this->$elementName = $children;
                    
                    break;
                    
                case 'Picture':
                    $this->$elementName = base64_decode((string) $xmlElement);
                    
                    break;
                    
                default:
                    list ($nameSpace, $elementProperties) = $this->_getElementProperties($elementName);
                    
                    switch ($elementProperties['type']) {
                        case 'datetime':
                            $this->$elementName = new DateTime((string) $xmlElement, new DateTimeZone('UTC'));
                            
                            break;
                            
                        case 'number':
                            $this->$elementName = (int) $xmlElement;
                            
                            break;
                        default:
                            $this->$elementName = (string) $xmlElement;
                            
                            break;
                    }
            }
        }
    }
    
    protected function _parseContacts2Namespace(SimpleXMLElement $properties)
    {
        // fetch data from Contacts2 namespace
        $children = $properties->children('uri:Contacts2');
    
        foreach ($children as $elementName => $xmlElement) {
    
            switch ($elementName) {
                default:
                    $this->$elementName = (string) $xmlElement;
            }
        }
    }    
}