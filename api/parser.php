<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$search = $_GET['q'] ?? '';

if (!$search) {
    echo json_encode(['success' => false, 'error' => 'Нет запроса']);
    exit;
}

$prices = [];
$ch = curl_init();

$brands = ['ASUS', 'Asus', 'Gigabyte', 'MSI', 'Intel', 'AMD', 'Nvidia', 'Kingston', 'Corsair', 'Samsung', 'WD', 'Seagate', 'Acer', 'HP', 'Dell', 'Lenovo'];

function remove_brand($query, $brands) {
    foreach ($brands as $brand) {
        if (stripos($query, $brand) === 0) {
            $after_brand = trim(substr($query, strlen($brand)));
            if (!empty($after_brand)) {
                return $after_brand;
            }
        }
    }
    return $query;
}

$search_for_oldi = remove_brand($search, $brands);
if (empty($search_for_oldi)) $search_for_oldi = $search;

curl_setopt($ch, CURLOPT_URL, 'https://www.oldi.ru/search/?q=' . urlencode($search_for_oldi));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
$html = curl_exec($ch);

$oldi_price = null;
$oldi_url = null;

if ($html) {
    preg_match_all('/<div[^>]*class="[^"]*product-item[^"]*"[^>]*>(.*?)<\/div>\s*<\/div>\s*<\/div>/is', $html, $product_blocks);
    
    if (empty($product_blocks[1])) {
        preg_match_all('/<div[^>]*class="[^"]*product-item[^"]*"[^>]*>(.*?)<\/div>\s*<\/div>/is', $html, $product_blocks);
    }
    
    foreach ($product_blocks[1] as $block) {
        $price = 0;
        
        if (preg_match('/<div[^>]*class="[^"]*price-block[^"]*"[^>]*>.*?<div[^>]*class="[^"]*price[^"]*"[^>]*>.*?<strong>([0-9\s]+)/is', $block, $price_match)) {
            $price = (int)preg_replace('/[^0-9]/', '', $price_match[1]);
        } elseif (preg_match('/<strong>([0-9\s]+)\s*₽/is', $block, $price_match)) {
            $price = (int)preg_replace('/[^0-9]/', '', $price_match[1]);
        } elseif (preg_match('/<strong>([0-9\s]+)<\/strong>/is', $block, $price_match)) {
            $price = (int)preg_replace('/[^0-9]/', '', $price_match[1]);
        }
        
        if ($price > 0) {
            $oldi_price = $price;
            if (preg_match('/<a[^>]*href="([^"]+)"[^>]*>/i', $block, $link_match)) {
                $oldi_url = $link_match[1];
                if (strpos($oldi_url, 'http') !== 0) {
                    $oldi_url = 'https://www.oldi.ru' . $oldi_url;
                }
            }
            break;
        }
    }
}

curl_setopt($ch, CURLOPT_URL, 'https://ekb.uct1.ru/search/?q=' . urlencode($search));
$html = curl_exec($ch);

$uct1_price = null;
$uct1_url = null;

if ($html) {
    preg_match_all('/<div[^>]*class="[^"]*catalog-item_body[^"]*"[^>]*>.*?<a[^>]*href="([^"]+)"[^>]*class="[^"]*name[^"]*"[^>]*>(.*?)<\/a>.*?<div[^>]*class="[^"]*catalog-item__new[^"]*"[^>]*>\s*<span[^>]*>(.*?)<\/span>/is', $html, $products, PREG_SET_ORDER);
    
    foreach ($products as $product) {
        $item_url = $product[1];
        $item_name = strip_tags($product[2]);
        $raw_price = $product[3]; 
        
        $lowercase_name = mb_strtolower($item_name, 'UTF-8');

        $stop_words = ['игровой компьютер', 'системный блок', 'сборка', 'пк', 'моноблок'];
        $skip_item = false;
        
        foreach ($stop_words as $stop_word) {
            if (mb_strpos($lowercase_name, $stop_word) !== false) {
                $skip_item = true;
                break;
            }
        }
        
        if ($skip_item) {
            continue; 
        }

        $clean_price = (int)preg_replace('/[^0-9]/', '', $raw_price);
        
        if ($clean_price > 0) {
            $uct1_price = $clean_price;
            $uct1_url = 'https://ekb.uct1.ru' . $item_url;
            break;
        }
    }
    
    if ($uct1_price) {
        $uct1_url = $uct1_url ?: 'https://ekb.uct1.ru/search/?q=' . urlencode($search);
    }
}

curl_setopt($ch, CURLOPT_URL, 'https://compday.ru/search/?q=' . urlencode($search));
$html = curl_exec($ch);

$compday_price = null;
$compday_url = null;

if ($html) {

    preg_match_all('/<a[^>]*href="([^"]+)"[^>]*class="name"[^>]*id="catName(\d+)"[^>]*>(.*?)<\/a>/i', $html, $products, PREG_SET_ORDER);
    
    foreach ($products as $product) {
        $item_url = $product[1];
        $item_id = $product[2];
        $item_name = strip_tags($product[3]);
        
        $lowercase_name = mb_strtolower($item_name, 'UTF-8');

        $stop_words = ['игровой компьютер', 'системный блок', 'сборка', 'пк'];
        $skip_item = false;
        
        foreach ($stop_words as $stop_word) {
            if (mb_strpos($lowercase_name, $stop_word) !== false) {
                $skip_item = true;
                break;
            }
        }
        
        if ($skip_item) {
            continue; 
        }
        
        $clean_item_name = $lowercase_name;
        $clean_search = mb_strtolower($search, 'UTF-8');
        
        $ignore_words = ['кулер', 'процессор', 'охлаждение', 'вентилятор', 'система', 'корпус', 'блок', 'питания', 'видеокарта', 'память', 'материнская', 'плата', 'ssd', 'hdd', 'накопитель', 'оем', 'бокс', 'для'];
        
        foreach ($ignore_words as $word) {
            $clean_item_name = str_replace($word, '', $clean_item_name);
            $clean_search = str_replace($word, '', $clean_search);
        }
        
        $clean_item_name = trim(preg_replace('/\s+/', ' ', $clean_item_name));
        $clean_search = trim(preg_replace('/\s+/', ' ', $clean_search));
        
        preg_match_all('/[a-zа-я0-9]+/u', mb_strtolower($clean_item_name, 'UTF-8'), $item_tokens);
        preg_match_all('/[a-zа-я0-9]+/u', mb_strtolower($clean_search, 'UTF-8'), $search_tokens);
        
        $item_words = $item_tokens[0];
        $search_words = $search_tokens[0];
        
        $is_match = true;
        
        if (count($search_words) === 0) {
            $is_match = false;
        } else {
            foreach ($search_words as $word) {
                if (!in_array($word, $item_words)) {
                    $is_match = false;
                    break; 
                }
            }
        }
        
        if ($is_match) {
            
            if (preg_match('/<b[^>]*id="catPrice' . $item_id . '"[^>]*>\s*([0-9\s]+)/i', $html, $price_match)) {
                $compday_price = (int)preg_replace('/[^0-9]/', '', $price_match[1]);
                $compday_url = 'https://compday.ru' . $item_url;
                break;
            }
        }
    }
}

if ($compday_price) {
    $compday_url = $compday_url ?: 'https://compday.ru/search/?q=' . urlencode($search);
}


$prices[] = [
    'name' => 'Oldi',
    'price' => $oldi_price,
    'url' => $oldi_url,
    'in_stock' => $oldi_price !== null
];

$prices[] = [
    'name' => 'UCT1',
    'price' => $uct1_price,
    'url' => $uct1_url,
    'in_stock' => $uct1_price !== null
];

$prices[] = [
    'name' => 'CompDay',
    'price' => $compday_price,
    'url' => $compday_url,
    'in_stock' => $compday_price !== null
];

echo json_encode(['success' => true, 'prices' => $prices, 'query' => $search]);
?>