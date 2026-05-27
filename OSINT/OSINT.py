import sys
import time
import re
import os
import platform
import concurrent.futures
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException

# Configuración global de sesión para mayor velocidad en peticiones HTTP
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Content-Type": "application/x-www-form-urlencoded"
})

def check_environment():
    import importlib
    in_venv = sys.prefix != sys.base_prefix
    print("*" * 45)
    if not in_venv:
        print("[!] Advertencia: Se recomienda ejecutar en un venv.")
    else:
        print("[OK] Entorno virtual detectado.")

    required = {'selenium': 'selenium', 'bs4': 'beautifulsoup4', 'requests': 'requests'}
    missing = []
    for lib, pkg in required.items():
        try:
            importlib.import_module(lib)
        except ImportError:
            missing.append(pkg)
            
    if missing:
        print(f"[ERROR] Instala: pip install {' '.join(missing)}")
        sys.exit(1)
    print("*" * 45)
    time.sleep(0.5)

# --- LÓGICA DE RUT ---
def validate_rut(rut):
    rut = rut.replace('.', '').replace('-', '').upper()
    if len(rut) < 2: return ''
    body, dv = rut[:-1], rut[-1]
    if not body.isdigit(): return ''
    
    sum_val = 0
    factors = [2, 3, 4, 5, 6, 7, 2, 3]
    for i, digit in enumerate(reversed(body)):
        sum_val += int(digit) * factors[i % len(factors)]
    expected_dv = str((11 - (sum_val % 11)) % 11)
    if expected_dv == '10': expected_dv = 'K'
    
    return format_rut(rut) if dv == expected_dv else ''

def format_rut(rut):
    rut = rut.replace('.', '').replace('-', '')
    if len(rut) < 2: return rut
    body, dv = rut[:-1], rut[-1]
    formatted = ""
    while len(body) > 3:
        formatted = "." + body[-3:] + formatted
        body = body[:-3]
    return body + formatted + "-" + dv

# --- CONSULTAS DE DATOS (REQUESTS) ---
def search_rut(rut):
    try:
        resp = session.post("https://www.nombrerutyfirma.com/rut", data={"term": rut})
        return BeautifulSoup(resp.text, "html.parser") if resp.status_code == 200 else None
    except: return None

def search_nombre(nombre):
    try:
        resp = session.post("https://www.nombrerutyfirma.com/nombre", data={"term": nombre})
        return BeautifulSoup(resp.text, "html.parser") if resp.status_code == 200 else None
    except: return None

def get_vehicle_soup(rut):
    try:
        resp = session.post("https://www.volanteomaleta.com/rut", data={"term": rut})
        return BeautifulSoup(resp.text, "html.parser") if resp.status_code == 200 else None
    except: return None

def search_vehiculo_por_patente(patente):
    try:
        resp = session.post("https://www.volanteomaleta.com/patente", data={"term": patente.upper()})
        return BeautifulSoup(resp.text, "html.parser") if resp.status_code == 200 else None
    except: return None

# --- CONSULTA PREVISIONAL (SELENIUM) ---
def query_pension_worker(rut, timeout):
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--blink-settings=imagesEnabled=false")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    })

    try:
        driver.get("https://www.spensiones.cl/apps/certificados/formConsultaAfiliacion.php")
        input_field = WebDriverWait(driver, timeout).until(EC.presence_of_element_located((By.NAME, "rut")))
        input_field.send_keys(rut.replace('.', '').replace('-', ''))
        
        btn = driver.find_element(By.ID, "btn_buscar")
        driver.execute_script("arguments[0].click();", btn)

        time.sleep(5) # Tiempo mínimo requerido por el sitio

        WebDriverWait(driver, 10).until(lambda d: d.find_elements(By.CLASS_NAME, "presentacion-app") or d.find_elements(By.CLASS_NAME, "g-recaptcha"))

        if driver.find_elements(By.CLASS_NAME, "g-recaptcha"):
            time.sleep(2)
            if not driver.find_elements(By.CLASS_NAME, "presentacion-app"): return "CAPTCHA"

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        res = soup.find('div', class_='presentacion-app')
        return re.sub(r'\s+', ' ', res.get_text()).strip() if res and len(res.get_text()) > 20 else "NO_DATA"
    except: return "TIMEOUT"
    finally: driver.quit()

# --- CONSULTA RNPI SUPERDESALUD (SELENIUM) ---
def query_rnpi_worker(rut):
    """Consulta el Registro Nacional de Prestadores Individuales de Salud.
    Usa XHR desde el contexto del browser (mismo origen) con el RUT formateado
    (con puntos y guión, ej: 6.678.744-3) para bypassear la restricción CORS.
    El endpoint prestador/getRut no requiere reCAPTCHA.
    """
    # El endpoint requiere el RUT con formato completo: 6.678.744-3
    rut_formateado = format_rut(rut.replace('.', '').replace('-', '').upper())
    if not rut_formateado:
        return None

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--blink-settings=imagesEnabled=false")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])

    driver = webdriver.Chrome(options=chrome_options)
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    })

    try:
        # Cargar la página para establecer el contexto de mismo origen
        driver.get("https://rnpi.superdesalud.gob.cl/")
        time.sleep(3)

        # Hacer XHR desde el contexto del browser (mismo origen = sin CORS block)
        raw = driver.execute_async_script("""
            var callback = arguments[arguments.length - 1];
            var rut = arguments[0];
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'prestador/getRut?rut=' + encodeURIComponent(rut), true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    callback(xhr.responseText);
                }
            };
            xhr.send(null);
        """, rut_formateado)

        if not raw or len(raw.strip()) == 0:
            return None  # RUT no registrado como prestador de salud

        import json as _json
        data = _json.loads(raw)
        hits = data.get("hits", {}).get("hits", [])
        if not hits:
            return None

        # Usar el hit con mayor score (generalmente el de buscador_rnpi)
        src = hits[0]["_source"]

        # Construir dict con los campos relevantes
        result = {
            "Nombre":          src.get("nombreCompleto", "").title(),
            "Título":          src.get("titulos", "N/D"),
            "Estado":          src.get("estado", "N/D"),
            "Habilitación":    src.get("habilitacion", "N/D"),
            "Nro. Registro":   str(src.get("nroRegistro", "N/D")),
            "Fecha Registro":  src.get("fechaRegistro", "N/D"),
            "Sexo":            src.get("sexo", "N/D"),
            "Nacionalidad":    src.get("nacionalidad", "N/D"),
            "Fecha Nacimiento":src.get("fechaNacimiento", "N/D"),
            "Región Trabajo":  src.get("regionTrabajo", "N/D"),
        }

        # Antecedentes (títulos, especialidades, etc.)
        antecedentes = src.get("antecedentes", [])
        for i, ant in enumerate(antecedentes, 1):
            glosa = ant.get("glosa", "")
            fecha = ant.get("fechaAntecedente", "")
            tipo  = ant.get("claseAntecedente", "")
            if glosa:
                result[f"Antecedente {i} ({tipo})"] = f"{glosa} [{fecha}]"

        return result

    except Exception:
        return None
    finally:
        driver.quit()

def parallel_pension_query(rut):
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(query_pension_worker, rut, t) for t in [12, 20]]
        for future in concurrent.futures.as_completed(futures):
            res = future.result()
            if res not in ["CAPTCHA", "TIMEOUT", "NO_DATA"]: return res
    return None

# --- PROCESAMIENTO ---
def process_person_enrichment(rut, use_selenium):
    """Ejecuta búsquedas de vehículos, pensión y RNPI en paralelo para ahorrar tiempo"""
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        f_veh  = executor.submit(get_vehicle_soup, rut)
        f_pen  = executor.submit(parallel_pension_query, rut) if use_selenium else None
        f_rnpi = executor.submit(query_rnpi_worker, rut) if use_selenium else None

        # 1. Mostrar Vehículos
        soup_v = f_veh.result()
        if soup_v:
            table = soup_v.find("table", class_="table-hover")
            if table and len(table.find_all("tr")) > 1:
                print("\n" + "*" * 10 + " VEHÍCULOS DETECTADOS " + "*" * 10)
                for row in table.find_all("tr")[1:]:
                    cols = row.find_all("td")
                    if len(cols) >= 7:
                        print(f"-> {cols[2].text.strip()} {cols[3].text.strip()} ({cols[6].text.strip()}) | Patente: {cols[0].text.strip()} | Motor: {cols[5].text.strip()}")
            else: print("\n[i] No se registran vehículos.")

        # 2. Mostrar Pensión
        if f_pen:
            res_p = f_pen.result()
            if res_p and res_p not in ["CAPTCHA", "TIMEOUT", "NO_DATA"]:
                print("\n" + "*" * 10 + " INFORMACIÓN PREVISIONAL " + "*" * 10)

                afp_m = re.search(r"se encuentra incorporado\(a\) a AFP (.*?), con fecha (.*?)\.", res_p)
                if afp_m:
                    print(f"AFP: {afp_m.group(1).strip()} | Afiliación: {afp_m.group(2).strip()}")

                afc_m = re.search(r"afiliado al Seguro de Cesantía con fecha (.*?)\.", res_p)
                if afc_m:
                    print(f"AFC: Afiliado con fecha {afc_m.group(1).strip()}")
                elif "no se encuentra afiliado(a) al Seguro de Cesantía" in res_p:
                    print("AFC: No registra afiliación al Seguro de Cesantía.")
            else:
                print("\n[!] Info Previsional: No disponible (CAPTCHA o Timeout).")

        # 3. Mostrar RNPI (Registro Nacional de Prestadores Individuales de Salud)
        if f_rnpi:
            rnpi = f_rnpi.result()
            print("\n" + "*" * 10 + " RNPI - PRESTADOR DE SALUD " + "*" * 10)
            if rnpi:
                if 'texto_libre' in rnpi:
                    print(rnpi['texto_libre'])
                else:
                    skip_keys = {'', 'Registro Nacional dePrestadores Individuales de Salud'}
                    for k, v in rnpi.items():
                        if k not in skip_keys and v and not v.startswith('{'):
                            print(f"{k}: {v}")
            else:
                print("\n[i] No se prestan servicios de Salud.")

def process_person_data(soup, use_selenium):
    table = soup.find("table", class_="table-hover")
    if not table:
        print("[!] No se encontraron resultados.")
        return

    for row in table.find_all("tr")[1:]:
        cols = row.find_all("td")
        if len(cols) >= 5:
            rut = cols[1].text.strip()
            print("\n" + "=" * 50)
            print(f"NOMBRE:    {cols[0].text.strip()}")
            print(f"RUT:       {rut}")
            print(f"DIRECCIÓN: {cols[3].text.strip()}, {cols[4].text.strip()}")
            print(f"SEXO:      {cols[2].text.strip()}")
            
            # Enriquecer con vehículos y pensiones en paralelo
            process_person_enrichment(rut, use_selenium)
            print("=" * 50)

def process_vehicle_by_patente(soup):
    table = soup.find("table", class_="table-hover")
    if not table or len(table.find_all("tr")) < 2:
        print("[!] Patente no encontrada.")
        return

    row = table.find_all("tr")[1]
    cols = row.find_all("td")
    if len(cols) >= 8:
        rut_dueno = cols[4].text.strip()
        print("\n" + "*" * 15 + " DATOS DEL VEHÍCULO " + "*" * 15)
        print(f"PATENTE: {cols[0].text.strip()} | TIPO: {cols[1].text.strip()}")
        print(f"MARCA:   {cols[2].text.strip()} | MODELO: {cols[3].text.strip()} | AÑO: {cols[6].text.strip()}")
        print(f"MOTOR:   {cols[5].text.strip()}")
        print("-" * 40)
        print(f"DUEÑO:   {cols[7].text.strip()} (RUT: {rut_dueno})")
        
        # Buscar dirección del dueño
        soup_p = search_rut(rut_dueno)
        if soup_p:
            t_p = soup_p.find("table", class_="table-hover")
            if t_p and len(t_p.find_all("tr")) > 1:
                c_p = t_p.find_all("tr")[1].find_all("td")
                print(f"DOMICILIO: {c_p[3].text.strip()}, {c_p[4].text.strip()}")
        print("*" * 50)

# --- UI Y MENÚ ---
def banner():
    print('''
    ███╗   ███╗ █████╗ ████████╗ ██████╗ ██████╗ ███╗   ██╗
    ████╗ ████║██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗████╗  ██║
    ██╔████╔██║███████║   ██║   ██║     ██║   ██║██╔██╗ ██║
    ██║╚██╔╝██║██╔══██║   ██║   ██║     ██║   ██║██║╚██╗██║
    ██║ ╚═╝ ██║██║  ██║   ██║   ╚██████╗╚██████╔╝██║ ╚████║
    ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝
            --- Open-Source Intelligence ---
                   OPTIMIZED VERSION 1.0
    ''')

def main():
    check_environment()
    use_selenium = platform.machine() != 'aarch64'

    while True:
        os.system('clear' if os.name != 'nt' else 'cls')
        banner()
        print("1. Buscar por RUT")
        print("2. Buscar por Nombre")
        print("3. Buscar por Patente")
        print("4. Salir")
        opt = input("\n[>] Opción: ")

        if opt == "1":
            rut = input("[?] Ingrese RUT: ")
            f_rut = validate_rut(rut)
            if f_rut:
                process_person_data(search_rut(f_rut), use_selenium)
            else: print("[!] RUT inválido.")
        
        elif opt == "2":
            nom = input("[?] Ingrese Nombre: ")
            process_person_data(search_nombre(nom), use_selenium)
            
        elif opt == "3":
            pat = input("[?] Ingrese Patente: ").upper()
            process_vehicle_by_patente(search_vehiculo_por_patente(pat))
            
        elif opt == "4": break
        input("\nPresiona Enter para continuar...")

if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt: print("\n[!] Saliendo...")
