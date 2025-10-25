@echo off
cd /d "%~dp0"

echo --------------------------------------------------
echo   シール受注商品一覧（米匠庵）ツールを起動しています
echo --------------------------------------------------
echo.
echo Webサーバーが起動しました。
echo ブラウザで以下のアドレスを開いてください:
echo http://localhost:8000
echo.
echo (Ctrlキーを押しながら上記のリンクをクリックすると簡単です)
echo. 
echo この黒い画面を閉じるとツールは終了します。
echo.

"C:\Users\asahi\AppData\Local\Programs\Python\Python313\python.exe" -m http.server 8000 > nul 2>&1

pause