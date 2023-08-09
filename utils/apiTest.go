package main

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
)

func main() {
	//sourceContent, err := os.ReadFile("sources/xcmfu.com.js")
	sourceContent, err := os.ReadFile("sources/pub.ddrd8.com.js")
	panicIfError(err)
	data := make(map[string][]string)
	data["source"] = []string{string(sourceContent)}
	data["function"] = []string{"chapter"}
	data["args"] = []string{`["","https://txt.ddrd8.com/read/921136/1"]`}
	qs := url.Values(data)
	resp, err := http.PostForm("http://10.10.60.162:9347/run", qs)
	panicIfError(err)
	respData, err := io.ReadAll(resp.Body)
	panicIfError(err)
	resp.Body.Close()
	fmt.Println(string(respData))
}

func panicIfError(err error) {
	if err != nil {
		panic(err)
	}
}
