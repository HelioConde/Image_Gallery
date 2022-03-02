<?php

$conteudo = "";
$nome = "";

foreach($_POST as $key => $value){
    if ($key == 'nome'){
       $nome = $value;
    } else {
        if ($conteudo == ""){
            $conteudo .= $key."";
        } else {
            $conteudo = $conteudo . ", " . $key;
        }
    }
}

$path = './'.$nome.'.txt';

$conteudo = str_replace("_"," ",$conteudo);

$fp = fopen($path,"wb");
fwrite($fp,$conteudo);
fclose($fp);

echo "<script>
        window.location.href = './enviado.html'
    </script>";

?>