<?php
/**
 * Syncroton
 *
 * @package     Model
 * @license     http://www.tine20.org/licenses/lgpl.html LGPL Version 3
 * @copyright   Copyright (c) 2012-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 * @author      Lars Kneschke <l.kneschke@metaways.de>
 */

/**
 * class to handle ActiveSync event
 *
 * @package     Model
 * @property    string  class
 * @property    string  collectionId
 * @property    bool    deletesAsMoves
 * @property    bool    getChanges
 * @property    string  syncKey
 * @property    int     windowSize
 */

class Syncroton_Model_Event extends Syncroton_Model_AEntry
{
    /**
     * busy status constants
     */
    const BUSY_STATUS_FREE      = 0;
    const BUSY_STATUS_TENATTIVE = 1;
    const BUSY_STATUS_BUSY      = 2;
    
    protected $_xmlBaseElement = 'ApplicationData';
    
    // @todo handle body
    protected $_properties = array(
        'AirSyncBase' => array(
            'Body'                   => array('type' => 'container')
        ),
        'Calendar' => array(
            'AllDayEvent'             => array('type' => 'number'),
            'AppointmentReplyTime'    => array('type' => 'datetime'),
            'Attendees'               => array('type' => 'container'),
            //'Body'                    => 0x0b,
            //'BodyTruncated'           => 0x0c,
            'BusyStatus'              => array('type' => 'number'),
            'Categories'              => array('type' => 'container'),
            'DisallowNewTimeProposal' => array('type' => 'number'),
            'DtStamp'                 => array('type' => 'datetime'),
            'EndTime'                 => array('type' => 'datetime'),
            'Exceptions'              => array('type' => 'container'),
            'Location'                => array('type' => 'string'),
            'MeetingStatus'           => array('type' => 'number'),
            'OnlineMeetingConfLink'   => array('type' => 'string'),
            'OnlineMeetingExternalLink' => array('type' => 'string'),
            'OrganizerEmail'          => array('type' => 'string'),
            'OrganizerName'           => array('type' => 'string'),
            'Recurrence'              => array('type' => 'container'),
            'Reminder'                => array('type' => 'number'),
            'ResponseRequested'       => array('type' => 'number'),
            'ResponseType'            => array('type' => 'number'),
            //'Rtf'                     => 0x10,
            'Sensitivity'             => array('type' => 'number'),
            'StartTime'               => array('type' => 'datetime'),
            'Subject'                 => array('type' => 'string'),
            'Timezone'                => array('type' => 'timezone'),
            'UID'                     => array('type' => 'string'),
        )
    );
    
    public function appendXML(DOMElement $_domParrent)
    {
        $this->_addXMLNamespaces($_domParrent);
        
        foreach($this->_elements as $elementName => $value) {
            // skip empty values
            if($value === null || $value === '' || (is_array($value) && empty($value))) {
                continue;
            }
            
            list ($nameSpace, $elementProperties) = $this->_getElementProperties($elementName);
            
            $nameSpace = 'uri:' . $nameSpace;
            
            // strip off any non printable control characters
            if (!ctype_print($value)) {
                #$value = $this->removeControlChars($value);
            }
            
            switch($elementName) {
                case 'Attendees':
                    $element = $_domParrent->ownerDocument->createElementNS($nameSpace, $elementName);
                    
                    foreach ($value as $attendee) {
                        $attendeeElement = $_domParrent->ownerDocument->createElementNS($nameSpace, 'Attendee');
                        $attendee->appendXML($attendeeElement);
                        $element->appendChild($attendeeElement);
                    }
                    
                    $_domParrent->appendChild($element);
                    
                    break;

                case 'Body':
                    $element = $_domParrent->ownerDocument->createElementNS($nameSpace, $elementName);
                
                    $value->appendXML($element);
                
                    $_domParrent->appendChild($element);
                
                    break;
                    
                case 'Categories':
                    $element = $_domParrent->ownerDocument->createElementNS($nameSpace, $elementName);
                    
                    foreach($value as $category) {
                        $categoryElement = $_domParrent->ownerDocument->createElementNS($nameSpace, 'Category');
                        $categoryElement->appendChild($_domParrent->ownerDocument->createTextNode($category));
                        
                        $element->appendChild($categoryElement);
                    }
                    
                    $_domParrent->appendChild($element);
                    
                    break;

                case 'Exceptions':
                    $element = $_domParrent->ownerDocument->createElementNS($nameSpace, $elementName);
                    
                    foreach ($value as $exception) {
                        $exceptionElement = $_domParrent->ownerDocument->createElementNS($nameSpace, 'Exception');
                        $exception->appendXML($exceptionElement);
                        $element->appendChild($exceptionElement);
                    }
                    
                    $_domParrent->appendChild($element);
                                        
                    break;

                case 'Recurrence':
                    $element = $_domParrent->ownerDocument->createElementNS($nameSpace, $elementName);
                    
                    $value->appendXML($element);
                    
                    $_domParrent->appendChild($element);
                    
                    break;
                    
                default:
                    $element = $_domParrent->ownerDocument->createElementNS($nameSpace, $elementName);
                    
                    if ($value instanceof DateTime) {
                        $value = $value->format("Ymd\THis\Z");
                    }
                    $element->appendChild($_domParrent->ownerDocument->createTextNode($value));
                    
                    $_domParrent->appendChild($element);
            }
        }
        
    }
    
    protected function _parseCalendarNamespace(SimpleXMLElement $properties)
    {
        // fetch data from Contacts namespace
        $children = $properties->children('uri:Calendar');
    
        foreach ($children as $elementName => $xmlElement) {
    
            switch ($elementName) {
                case 'Attendees':
                    $attendees = array();
                    
                    foreach ($xmlElement->Attendee as $attendee) {
                        $attendees[] = new Syncroton_Model_EventAttendee($attendee);
                    }
                    
                    $this->$elementName = $attendees;
                    
                    break;
                    
                case 'Categories':
                    $categories = array();
                    
                    foreach ($xmlElement->$elementName as $category) {
                        $categories[] = (string) $category;
                    }
                    
                    $this->$elementName = $categories;
                    
                    break;
                    
                case 'Exceptions':
                    $exceptions = array();
                    
                    foreach ($xmlElement->Exception as $exception) {
                        $exceptions[] = new Syncroton_Model_EventException($exception);
                    }
                    
                    $this->$elementName = $exceptions;
                    
                    break;
                    
                case 'Recurrence':
                    $this->$elementName = new Syncroton_Model_EventRecurrence($xmlElement);
                    
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
    
    protected function _parseAirSyncBaseNamespace(SimpleXMLElement $properties)
    {
        // fetch data from AirSyncBase namespace
        $children = $properties->children('uri:AirSyncBase');
    
        foreach ($children as $elementName => $xmlElement) {
    
            switch ($elementName) {
                case 'Body':
                    $this->$elementName = new Syncroton_Model_EmailBody($xmlElement);
    
                    break;
                    
                default:
                    list ($nameSpace, $elementProperties) = $this->_getElementProperties($elementName);
                    
                    switch ($properties['type']) {
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
}