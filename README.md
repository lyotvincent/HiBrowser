# Start the Browser standalone

Download the source code from our [github repo](https://github.com/NKUlpj/HiBrowser).

## 1、backend

### Requirements

* python=3.8
* numpy
* django=4.1
* django-cors-headers=3.13.0
* requests=2.28.1

---
<b>We recommend using `conda` to create a virtual environment.</b>

Install [conda](https://docs.conda.io/en/latest/miniconda.html) firstly. 

1. Enter the `backend`
2. `conda create --name <your_name> --file requirements.txt`
3. `conda activate <your_name>`
4. Modify `/HicBrowser/setting.py`, Change to your IP address or domain name
```python
ALLOWED_HOSTS = ["192.168.31.196"]
```
6. `python manage.py runsever 0.0.0.0:<your_port>`
---

## 2、frontend
Install [nginx](http://nginx.org/en/download.html).

1. Enter `/frontend`
2. Copy all files to the root directory of your nginx

```sh
## How to find the root directory
# Linux
cat /usr/local/nginx/conf/nginx.conf

# Windows
## In your downloaded compressed file
```

3. Modify `/js/global.js`, change to your backend address
```js
export const api_url = 'your_ip:your_port/api';
```
4. Start your nginx
```sh
# Linux
cd usr/local/nginx/sbin
./nginx

# Windows 
start  nginx.exe
```

## 3、docs

1. Enter `/docs`
2. Open `index.html` with your browser[eg. Google Chrome]
