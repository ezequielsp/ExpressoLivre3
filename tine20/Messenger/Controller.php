<?php

class Messenger_Controller extends Tinebase_Controller_Event
{

    /*
     * path to save chat history temporarily
     */
    const TMP_PATH = '/tmp/tine20im';

    /*
     * path to save contact history
     */
    const HISTORY_PATH = '/var/tmp/apache2/tine20im/history';

    /**
     * holds the instance of the singleton
     *
     * @var Messenger_Controller
     */
    private static $_instance = NULL;
    
    /**
     * application name
     *
     * @var string
     */
    protected $_applicationName = 'Messenger';

    /**
     * constructor (get current user)
     */
    private function __construct()
    {
    }
    
    /**
     * don't clone. Use the singleton.
     *
     */
    private function __clone() 
    {        
    }
    
    /**
     * the singleton pattern
     *
     * @return Felamimail_Controller
     */
    public static function getInstance() 
    {
        if (self::$_instance === NULL) {
            self::$_instance = new Messenger_Controller;
        }
        
        return self::$_instance;
    }
    
    public function getMessengerConfig()
    {
        $config = self::getConfig();

        return array(
            'domain'         => $config['messenger']['domain'],
            'resource'       => $config['messenger']['resource'],
            'format'         => $config['messenger']['format'],
            'rtmfpServerUrl' => $config['messenger']['rtmfpServerUrl']
        );
    }
    
    /**
     *
     * @return JSON_Array
     */
    public function getLocalServerInfo($_login)
    {
        return array(
            'ip' => $_SERVER['SERVER_ADDR']
        );
    }
    
    public function removeTempFiles($_files)
    {
        $value = true;
        foreach ($_files as $file)
            $value = $value && unlink($file);
        
        return array(
            'status' => $value
        );
    }
    
    public function listHistory($jid, $contact)
    {
        $response = null;
        $path = self::HISTORY_PATH . '/' . $jid . '/' . $contact;
        if (!file_exists($path)) {
            $response = array(
                'status'  => false,
                'content' => ''
            );
        } else {
            $dir = new DirectoryIterator($path);
            $dates = array();
            foreach ($dir as $file)
            {
                if (!$file->isDot())
                    $dates[] = $file->getBasename('.json');
            }
            
            rsort($dates);
            
            $response = array(
                'status'  => true,
                'content' => $dates
            );
        }
        return $response;
    }
    
    public function getHistory($jid, $contact, $date)
    {
        $response = null;
        $filename = self::HISTORY_PATH . '/' . $jid . '/' . $contact . '/' . $date . '.json';
        if (!file_exists($filename)) {
            $response = array(
                'status' => 'false',
                'content' => ''
            );
        } else {
            $lines = explode("\n", file_get_contents($filename));
            $content = array();
            foreach ($lines as $line)
                $content[] = $line;
            
            $response = array(
                'status' => 'true',
                'content' => $content
            );
        }
        
        return $response;
    }

    public function saveHistory($jid, $contact, $direction, $message, $time)
    {
        $path = self::HISTORY_PATH . '/' . $jid . '/' . $contact . '/';
        if (!file_exists($path))
            mkdir($path, 0777, true);
        
        $filename = date('Y-m-d') . '.json';
        $data = json_encode(array(
            'time' => $time,
            'dir'  => $direction,
            'msg'  => $message
        ));
        
        $result = file_put_contents($path . $filename, $data . PHP_EOL, FILE_APPEND);
        
        return array('status' => $result, 'what' => 'history', 'file' => $path . $filename);
    }
    
    public function saveChatHistory($id, $title, $content)
    {
        $config = self::getConfig();
        
        $tempPath = !empty($config['messenger']['tempFiles']) ?
                        $config['messenger']['tempFiles'] :
                        $tempPath = self::TMP_PATH;

        if (!file_exists($tempPath))
            mkdir($tempPath);

        $length = strlen($content);
        $status = null;
        $fileName = null;

        if ($length > 0)
        {
            $style = self::chatHistoryStyle();
            $head = "<head>
                       <title>Chat History</title>
                       <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />
                       $style
                     </head>";
            $body = "<body><h1>$title</h1>$content</body>";
            $html = "<html>$head$body</html>";
            $fileName = $id . '-' . time() . '.html';
            $filePath = $tempPath . '/' . $fileName;
            $response = file_put_contents($filePath, $html, FILE_APPEND);
            
            if ($response !== false)
            {
                $status = 'OK';
            }
            else
            {
                $status = 'ERROR';
                $fileName = null;
                $filePath = null;
            }
        }
        else
        {
            $status = 'NO_FILE';
            $fileName = 'no file';
            $filePath = $tempPath;
        }
        
        return array(
            'status'   => $status,
            'fileName' => $fileName,
            'filePath' => $filePath
        );
    }
    
    public function getTempPath()
    {
        $config = self::getConfig();
        
        $tempPath = !empty($config['messenger']['tempFiles']) ?
                        $config['messenger']['tempFiles'] :
                        $tempPath = self::TMP_PATH;

        if (!file_exists($tempPath))
            mkdir($tempPath);
        
        return $tempPath;
    }
    
    private static function getConfig()
    {
        return Tinebase_Config::getInstance()->getConfigAsArray(Tinebase_Model_Config::MESSENGER);
    }
    
    private static function chatHistoryStyle()
    {
        return '<style>
                 .chat-message-notify {
                    padding: 2px 4px;
                 }
                 .chat-message-notify .chat-user-msg {
                    padding: 0 5px;
                    font-size: 100%;
                    font-weight: bold;
                    color: #333;
                 }
                 .chat-message-balloon .chat-user {
                     width: 50px;
                     padding: 8px 3px 3px 3px;
                     text-align: center;
                     font-size: 100%;
                     font-weight: bold;
                     float: left;
                     word-break: break-all;
                     overflow: hidden;
                 }
                 .chat-message-balloon .chat-user-msg {
                     font-size: 110%;
                     float: left;
                     padding: 7px 15px;
                     word-break: break-all;
                     -moz-border-radius: 10px;
                     -webkit-border-radius: 10px;
                 }
                 .chat-user-timestamp {
                    font-size: 10px;
                    color: #777;
                 }
                 .chat-user-balloon {
                    padding-left: 14px;
                    float: left;
                    max-width: 70%;
                    background-repeat: no-repeat;
                    background-position-y: 6px;
                    margin-top: 6px;
                    background-image: url("/images/messenger/balloon-pointer.png");
                 }
                 .color-1 .chat-user-msg { background-color: #8fb1e8 }
                 .color-1 .chat-user, .color-1 .x-tree-node-anchor span { color: #8fb1e8!important}
                 .color-1 .chat-user-balloon { background-position-x: 0 }

                 .color-2 .chat-user-msg { background-color: #98d96c }
                 .color-2 .chat-user, .color-2 .x-tree-node-anchor span  { color: #98d96c!important}
                 .color-2 .chat-user-balloon { background-position-x: -15px }

                 .color-3 .chat-user-msg { background-color: #fff }
                 .color-3 .chat-user, .color-3 .x-tree-node-anchor span  { color: #fff!important}
                 .color-3 .chat-user-balloon { background-position-x: -30px }

                 .color-4 .chat-user-msg { background-color: #ffb380 }
                 .color-4 .chat-user, .color-4 .x-tree-node-anchor span  { color: #ffb380!important}
                 .color-4 .chat-user-balloon { background-position-x: -45px }

                 .color-5 .chat-user-msg { background-color: #ffe680 }
                 .color-5 .chat-user, .color-5 .x-tree-node-anchor span  { color: #ffe680!important}
                 .color-5 .chat-user-balloon { background-position-x: -60px }

                 .color-6 .chat-user-msg { background-color: #ff8080 }
                 .color-6 .chat-user, .color-6 .x-tree-node-anchor span  { color: #ff8080!important}
                 .color-6 .chat-user-balloon { background-position-x: -75px }

                 .color-7 .chat-user-msg { background-color: #ac9393 }
                 .color-7 .chat-user, .color-7 .x-tree-node-anchor span  { color: #ac9393!important}
                 .color-7 .chat-user-balloon { background-position-x: -90px }
                </style>';
    }
    
}