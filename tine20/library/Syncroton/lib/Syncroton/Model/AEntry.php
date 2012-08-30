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
 * abstract class to handle ActiveSync entry
 *
 * @package     Syncroton
 * @subpackage  Model
 */

abstract class Syncroton_Model_AEntry implements Syncroton_Model_IEntry, IteratorAggregate, Countable
{
    protected $_xmlBaseElement;
    
    protected $_elements = array();
    
    protected $_properties = array();
    
    protected $_dateTimeFormat = "Y-m-d\TH:i:s.000\Z";
    
    public function __construct($properties = null)
    {
        if ($properties instanceof SimpleXMLElement) {
            $this->setFromSimpleXMLElement($properties);
        } elseif (is_array($properties)) {
            $this->setFromArray($properties);
        }
    }
    
    /**
     * (non-PHPdoc)
     * @see Syncroton_Model_IEntry::appendXML()
     */
    public function appendXML(DOMElement $_domParrent)
    {
        $this->_addXMLNamespaces($_domParrent);
        
        foreach($this->_elements as $elementName => $value) {
            // skip empty values
            if($value === null || $value === '' || (is_array($value) && empty($value))) {
                continue;
            }
            
            list ($nameSpace, $elementProperties) = $this->_getElementProperties($elementName);
            
            if ($nameSpace == 'Internal') {
                continue;
            }
            
            $nameSpace = 'uri:' . $nameSpace;
            
            // strip off any non printable control characters
            if (!ctype_print($value)) {
                #$value = $this->removeControlChars($value);
            }
            
            if (isset($elementProperties['childElement'])) {
                $element = $_domParrent->ownerDocument->createElementNS($nameSpace, ucfirst($elementName));
                foreach($value as $subValue) {
                    $subElement = $_domParrent->ownerDocument->createElementNS($nameSpace, ucfirst($elementProperties['childElement']));
                    
                    $this->_appendXMLElement($subElement, $elementProperties, $subValue);
                    
                    $element->appendChild($subElement);
                    
                }
                $_domParrent->appendChild($element);
            } else {
                $element = $_domParrent->ownerDocument->createElementNS($nameSpace, ucfirst($elementName));
                
                $this->_appendXMLElement($element, $elementProperties, $value);
                
                $_domParrent->appendChild($element);
            }
            
        }
    }
    
    /**
     * (non-PHPdoc)
     * @see Countable::count()
     */    
    public function count()
    {
        return count($this->_elements);
    }
    
    /**
     * (non-PHPdoc)
     * @see IteratorAggregate::getIterator()
     */
    public function getIterator() 
    {
        return new ArrayIterator($this->_elements);
    }
    
    /**
     * (non-PHPdoc)
     * @see Syncroton_Model_IEntry::getProperties()
     */
    public function getProperties()
    {
        $properties = array();
        
        foreach($this->_properties as $namespace => $namespaceProperties) {
            $properties = array_merge($properties, array_keys($namespaceProperties));
        }
        
        return $properties;
        
    }
    
    public function setFromArray(array $properties)
    {
        $this->_elements = array();
        
        foreach($properties as $key => $value) {
            try {
                $this->$key = $value; //echo __LINE__ . PHP_EOL;
            } catch (InvalidArgumentException $iae) {
                //ignore invalid properties
                //echo __LINE__ . PHP_EOL; echo $iae->getMessage(); echo $iae->getTraceAsString();
            }
        }
    }
    
    /**
     * set properties from SimpleXMLElement object
     *
     * @param SimpleXMLElement $xmlCollection
     * @throws InvalidArgumentException
     */
    public function setFromSimpleXMLElement(SimpleXMLElement $properties)
    {
        if (!in_array($properties->getName(), (array) $this->_xmlBaseElement)) {
            throw new InvalidArgumentException('Unexpected element name: ' . $properties->getName());
        }
    
        $this->_elements = array();
    
        foreach (array_keys($this->_properties) as $namespace) {
            if ($namespace == 'Internal') {
                continue;
            }
            
            $this->_parseNamespace($namespace, $properties);
        }
    
        return;
    }
    
    /**
     * add needed xml namespaces to DomDocument
     * 
     * @param unknown_type $_domParrent
     */
    protected function _addXMLNamespaces(DOMElement $_domParrent)
    {
        foreach($this->_properties as $namespace => $namespaceProperties) {
            // don't add default namespace again
            if($_domParrent->ownerDocument->documentElement->namespaceURI != 'uri:'.$namespace) {
                $_domParrent->ownerDocument->documentElement->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:'.$namespace, 'uri:'.$namespace);
            }
        }
    }
    
    protected function _appendXMLElement($element, $elementProperties, $value)
    {
        if ($value instanceof Syncroton_Model_IEntry) {
            $value->appendXML($element);
        } else {
            if ($value instanceof DateTime) {
                $value = $value->format($this->_dateTimeFormat);
                
            } elseif (isset($elementProperties['encoding']) && $elementProperties['encoding'] == 'base64') {
                if (is_resource($value)) {
                    stream_filter_append($value, 'convert.base64-encode');
                    $value = stream_get_contents($value);
                } else {
                    $value = base64_encode($value);
                }
            }
            
            $element->appendChild($element->ownerDocument->createTextNode($value));
        }
    }
    
    /**
     * 
     * @param unknown_type $element
     * @throws InvalidArgumentException
     * @return multitype:unknown
     */
    protected function _getElementProperties($element)
    {
        foreach($this->_properties as $namespace => $namespaceProperties) {
            if (array_key_exists($element, $namespaceProperties)) {
                return array($namespace, $namespaceProperties[$element]);
            }
        }
        
        throw new InvalidArgumentException("$element is no valid property of " . get_class($this));
    }
    
    protected function _parseNamespace($nameSpace, SimpleXMLElement $properties)
    {
        // fetch data from Contacts namespace
        $children = $properties->children("uri:$nameSpace");
        
        foreach ($children as $elementName => $xmlElement) {
            $elementName = lcfirst($elementName);
            
            if (!isset($this->_properties[$nameSpace][$elementName])) {
                continue;
            }
            
            list (, $elementProperties) = $this->_getElementProperties($elementName);
            
            switch ($elementProperties['type']) {
                case 'container':
                    if (isset($elementProperties['childElement'])) {
                        $property = array();
                        
                        $childElement = ucfirst($elementProperties['childElement']);
                        
                        foreach ($xmlElement->$childElement as $subXmlElement) {
                            if (isset($elementProperties['class'])) {
                                $property[] = new $elementProperties['class']($subXmlElement);
                            } else {
                                $property[] = (string) $subXmlElement;
                            }
                        }
                    } else {
                        $subClassName = isset($elementProperties['class']) ? $elementProperties['class'] : get_class($this) . ucfirst($elementName);
                        
                        $property = new $subClassName($xmlElement);
                    }
                    
                    break;
                    
                case 'datetime':
                    $property = new DateTime((string) $xmlElement, new DateTimeZone('UTC'));
    
                    break;
    
                case 'number':
                    $property = (int) $xmlElement;
    
                    break;
                    
                default:
                    $property = (string) $xmlElement;
    
                    break;
            }
            
            if (isset($elementProperties['encoding']) && $elementProperties['encoding'] == 'base64') {
                $property = base64_decode($property);
            }
            
            $this->$elementName = $property;
        }
    }
    
    public function &__get($name)
    {
        $this->_getElementProperties($name);
    
        return $this->_elements[$name];
    }
    
    public function __set($name, $value)
    {
        list ($nameSpace, $properties) = $this->_getElementProperties($name);
        
        if ($properties['type'] == 'datetime' && !$value instanceof DateTime) {
            throw new InvalidArgumentException("value for $name must be an instance of DateTime");
        }
        
        $this->_elements[$name] = $value;
    }
    
    public function __isset($name)
    {
        return isset($this->_elements[$name]);
    }
    
    public function __unset($name)
    {
        unset($this->_elements[$name]);
    }
}