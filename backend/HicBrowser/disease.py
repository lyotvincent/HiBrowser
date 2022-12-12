import ssl

# import rpy2.robjects as robjects
import requests
from urllib3.exceptions import InsecureRequestWarning
from urllib3 import disable_warnings


auth_params = {"email": "klstftz@gmail.com", "password": "1511182@Lpj"}

api_host = "https://www.disgenet.org/api"

disable_warnings(InsecureRequestWarning)






def get_token():
    s = requests.Session()
    requests.adapters.DEFAULT_RETRIES = 5  # 增加重连次数
    s.keep_alive = False  #
    api_key = None
    try:
        r = s.post(api_host + '/auth/', data=auth_params, verify=False)
        if r.status_code == 200:
            json_response = r.json()
            api_key = json_response.get("token")
    except requests.exceptions.RequestException as req_ex:
        print(req_ex)
    s.close()
    return api_key


def query_disease_by_gene(gene):
    api_key = get_token()
    s = requests.Session()
    if api_key:
        s.headers.update({"Authorization": "Bearer %s" % api_key})
        gda_response = s.get(
            api_host +
            '/gda/gene/' + gene,
            params={
                'limit': 20}
        )
        s.close()
        return gda_response.json()
    return None


def query_gene_by_disease(disease):
    api_key = get_token()
    print(api_key)
    s = requests.Session()
    if api_key:
        s.headers.update({"Authorization": "Bearer %s" % api_key})
        gda_response = s.get(
            api_host +
            '/gda/disease/' + disease,
            params={
                'limit': 20
            }
        )

        s.close()
        return gda_response.json()
    return None


print(query_disease_by_gene('APP'))
