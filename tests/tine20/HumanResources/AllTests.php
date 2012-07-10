<?php
/**
 * Tine 2.0 - http://www.tine20.org
 * 
 * @package     HumanResources
 * @license     http://www.gnu.org/licenses/agpl.html
 * @copyright   Copyright (c) 2012 Metaways Infosystems GmbH (http://www.metaways.de)
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 */

/**
 * Test helper
 */
require_once dirname(dirname(__FILE__)) . DIRECTORY_SEPARATOR . 'TestHelper.php';

if (! defined('PHPUnit_MAIN_METHOD')) {
    define('PHPUnit_MAIN_METHOD', 'HumanResources_AllTests::main');
}

class HumanResources_AllTests
{
    public static function main ()
    {
        PHPUnit_TextUI_TestRunner::run(self::suite());
    }
    
    public static function suite ()
    {
        $suite = new PHPUnit_Framework_TestSuite('Tine 2.0 HumanResources All Tests');
        $suite->addTestSuite('HumanResources_JsonTest');
        return $suite;
    }
}

if (PHPUnit_MAIN_METHOD == 'HumanResources_AllTests::main') {
    HumanResources_AllTests::main();
}
