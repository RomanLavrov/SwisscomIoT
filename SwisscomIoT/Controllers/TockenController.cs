using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Autodesk.Forge;
using Microsoft.AspNetCore.Mvc;

namespace SwisscomIoT.Controllers
{
    public class TockenController : Controller
    {
        [HttpGet]
        [Route("api/forge/token")]
        public async Task<string> GetToken()
        {
            TwoLeggedApi oauthApi = new TwoLeggedApi();
            dynamic bearer = await oauthApi.AuthenticateAsync(
                "mUAnGJsDnZAALOTZdNGDcV68ReVuscXO",
                "coCCQ99xevcPpLjD",
                "client_credentials",
                new Scope[] {Scope.DataRead});

            return (string) bearer.access_token;
        }
    }
}