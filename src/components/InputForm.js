import React, { useState } from "react";
import axios from "axios";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import './inputform.css';


const InputForm = () => {
  const [clients, setClients] = useState([
    {
      name: "",
      age: "",
      gender: "",
      payment_frequency: "Annually",
      relationship: "Main Applicant",
      length:"",
      area_of_coverage: "Worldwide",
      currency: "USD",
      nationality: "Indonesia",
      country_of_residence: "Indonesia",      
      plans: {
        hs: "Essential",
        hs_deductible: "Nil",
        op: "Essential",
        op_co_ins: "Nil",
        ma: "N/A",
        dn: "Essential",
      },
    },
  ]);
  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    contactNumber: "",
    emailAddress: "",
    country_residence: "Indonesia",
    nationality: "",
    area_of_coverage: "Worldwide",
  });
  const [response, setResponse] = useState([]);


  const getFamilyDiscountPercentage = (numDependents) => {
    if (numDependents === 2) {
      return 5;
    } else if (numDependents === 3) {
      return 7.5;
    } else if (numDependents === 4) {
      return 10;
    } else if (numDependents >= 5) {
      return 15; // Max discount for 5 or more dependents
    } else {
      return 0; // No discount for 1 applicant
    }
  };


  
  const handleClientChange = (index, e) => {
    const { name, value } = e.target;
    const updatedClients = [...clients];
    updatedClients[index][name] = value;
    setClients(updatedClients);
  };

  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;
    setContactInfo({ ...contactInfo, [name]: value });
  
    if (name === "area_of_coverage") {
      // Update area_of_coverage for all clients when it is changed
      const updatedClients = clients.map((client) => ({
        ...client,
        area_of_coverage: value, // Ensure all clients have the updated area of coverage
      }));
      setClients(updatedClients);
    }
  };
  

  const handlePlanChange = (index, type, value) => {
    const updatedClients = [...clients];
    updatedClients[index].plans[type] = value;
    setClients(updatedClients);
  };

  const addClient = () => {
    setClients([
      ...clients,
      {
        name: "",
        age: "",
        gender: "",
        payment_frequency: "Annually",
        relationship: "Dependent",
        length:"",
        area_of_coverage: contactInfo.area_of_coverage,
        currency: "USD",
        nationality: "Indonesia",
        country_of_residence: "Indonesia",
        plans: {
          hs: "Essential",
          hs_deductible: "Nil",
          op: "Essential",
          op_co_ins: "Nil",
          ma: "N/A",
          dn: "Essential",
        },
      },
    ]);
  };

  const removeClient = (index) => {
    setClients((prevClients) => prevClients.filter((_, i) => i !== index));
    setResponse((prevResponse) => prevResponse.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = "your-api-token";
      const apiUrl =
        "https://mib-quotetool.com/quoting_api/api/quotations/get_rates";

        const body = {
          contactInfo, // Include contact information
          clients,
          deductibles: clients.map((client) => client.plans.hs_deductible),
          specifics: {
            my_health_indonesia: clients.map((client) => ({
              hs: { plan: client.plans.hs, deductible: client.plans.hs_deductible },
              op: { plan: client.plans.op, co_ins: client.plans.op_co_ins },
              ma: { plan: client.plans.ma },
              dn: { plan: client.plans.dn },
            })),
          },
          insurers: ["my_health_indonesia"],
        };
  
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        };

      const result = await axios.post(apiUrl, body, config);
      setResponse(
        result.data.my_health_indonesia.rates.map((rate) => ({
          ...rate,
          hs: rate.hs ? parseFloat(rate.hs.toFixed(2)) : "N/A",
          op: rate.op ? parseFloat(rate.op.toFixed(2)) : "N/A",
          ma: rate.ma ? parseFloat(rate.ma.toFixed(2)) : "N/A",
          dn: rate.dn ? parseFloat(rate.dn.toFixed(2)) : "N/A",
        }))
      );
    } catch (error) {
      console.error("Error fetching API:", error.response || error.message);
      alert(
        "Failed to fetch data. Please check your input or API requirements."
      );
    }
  };

  const calculateTotalPremium = () => {
    return response
      .reduce((total, rate) => {
        const subtotal = ["hs", "op", "ma", "dn"]
          .map((key) => (rate[key] !== "N/A" && rate[key] !== undefined ? rate[key] : 0))
          .reduce((sum, premium) => sum + premium, 0);
        return total + subtotal;
      }, 0)
      .toFixed(2);
  };

  const handleEmailSubmit = async () => {
    try {
      const emailPayload = {contactInfo, 
        // email: "calvin@medishure.com", // Your email address to receive the data
        plans: response.map((rate, index) => ({
          client: `${clients[index].name} (${clients[index].gender}, ${clients[index].age})`,
          hospitalSurgery: `Premium: USD ${rate.hs || "N/A"}`,
          outpatient: `Premium: USD ${rate.op || "N/A"}`,
          maternity: `Premium: USD ${rate.ma || "N/A"}`,
          dental: `Premium: USD ${rate.dn || "N/A"}`,
          subtotal: `USD ${
            ["hs", "op", "ma", "dn"]
              .map((key) =>
                rate[key] !== undefined && rate[key] !== "N/A" ? rate[key] : 0
              )
              .reduce((sum, premium) => sum + premium, 0)
              .toFixed(2)
          }`,
        })),
        totalPremium: calculateTotalPremium(),
        
      };
  
      const result = await axios.post(
        "https://quotation-tool-backend.vercel.app/send-email", // Updated to deployed backend URL
        emailPayload
      );
      alert(result.data.message);
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email.");
    }
  };

  return (
    <div className="container my-4">
      <h1 className="text-center mb-2">
        I would like to know more about about{" "}
        <span style={{ color: "Green" }}>MY HEALTH</span> Family Discount
      </h1>
      <h5 className="text-center mb-2">
        My Health can accept applications from people aged 65 years or younger.
        To find out the best and discounted plan for <br></br>you and your
        family, you`ll need to provide some information:
      </h5>

      <h4 className="text-left mt-4">
  
        <span style={{ color: "Green" }}>Plans</span>
      </h4>

      <table className="table table-bordered table-striped mt-3 text-center plan">
      <thead>
        <tr>
            <th>Modules</th>
            <th>Core</th>
            <th>Essential</th>
            <th>Extensive</th>
            <th>Elite</th>
        </tr>
      </thead>      
      <tbody>
        <tr>
            <td>Hospital Surgery <br></br>
                Annual limit per person per period of insurance<br></br>
                -Standard private room<br></br>
                -Emergency dental treatment<br></br>
                -Diagnostic scans and test <br></br>
                6 levels of deductibles: $0, $500, $1000, $2,500, $5,000 or $10,000
            </td>
            <td>$300,000</td>
            <td>$1,000,000</td>
            <td>$2,500,000</td>
            <td>$3,000,000</td>
        </tr>
        <tr>
            <td>Outpatient (Optional)</td>
            <td>$2,000</td>
            <td>$5,000</td>
            <td>Full Cover</td>
            <td>Full Cover</td>
        </tr>
        <tr>
            <td>Maternity (Optional)</td>
            <td>Not Available</td>
            <td>$5,000 per pregnancy</td>
            <td>$8,000 per pregnancy</td>
            <td>$15,000 per pregnancy</td>
        </tr>
        <tr>
            <td>Dental and Optical (Optional)</td>
            <td>.</td>
            <td>..</td>
            <td>...</td>
            <td>....</td>
        </tr>
        <tr>
            <td>24/7 Evacuation,repatriation and assistance services</td>
            <td>Included up to $1,000,000</td>
            <td>Included up to $1,000,000</td>
            <td>Included up to $1,000,000</td>
            <td>Included up to $3,000,000</td>
        </tr>
      </tbody>

    </table>
      <h4 className="text-left mb-4">
        {" "}
        <span style={{ color: "Green" }}>Contact Information</span>
      </h4>
      <div className="row mb-3">
        <div className="col-md-3">
          <label className="field_name">Full Name:</label>
          <input type="text"className="form-control"name="fullName" value={contactInfo.fullName} onChange={handleContactInfoChange}  required/>
        </div>
        <div className="col-md-2">
          <label className="field_name">Contact Number:</label>
          <input type="text" className="form-control" name="contactNumber" value={contactInfo.contactNumber} onChange={handleContactInfoChange}required/>
        </div>
        
        <div className="col-md-3">
          <label className="field_name">Email Address:</label>
          <input type="email" className="form-control" name="emailAddress" value={contactInfo.emailAddress} onChange={handleContactInfoChange}required/>
        </div>
        <div className="col-md-2">
          <label className="field_name">Country of Residence:</label>
          <select className="form-control" name="country_residence" value={contactInfo.country_residence}>
              <option value="Indonesia">Indonesia</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="field_name">Nationality:</label>
          <input type="text" className="form-control" name="nationality" value={contactInfo.nationality}onChange={handleContactInfoChange} required/>
        </div>
        {/* <div className="col-md-4">
          <label>Area of Coverage:</label>
          <select className="form-control"name="area_of_coverage"value={contactInfo.area_of_coverage} onChange={handleContactInfoChange}>
                     <option value="Worldwide">Worldwide</option>
                      <option value="Worldwide excl USA">Worldwide excl USA</option>
                      <option value="ASEAN Ex. SG">ASEAN Ex. SG</option>
          </select>
        </div> */}
      </div>

      <h4 className="text-left mb-4">
        {" "}
        <span style={{ color: "Green" }}>Policy Information</span>
      </h4>
      <form onSubmit={handleSubmit}>
        <div className="d-flex justify-content-end mb-2">
          <button type="button"className="btn btn-primary" onClick={addClient}>
            <i className="fas fa-user-friends"></i> Add Dependent(s)
          </button>
        </div>
        {clients.map((client, index) => (
          <div key={index} className="mb-3">
            <div>
              <div className="row">
                <div className="col-md-3">
                  <label className="field_name">Name:</label>
                  <input type="text" className="form-control"name="name" value={client.name}onChange={(e) => handleClientChange(index, e)}required/>
                </div>
                <div className="col-md-1">
                  <label className="field_name">Age:</label>
                  <input type="number" className="form-control"name="age" value={client.age} onChange={(e) => handleClientChange(index, e)} required/>
                </div>
                <div className="col-md-2">
                  <label className="field_name">Gender:</label>
                  <select className="form-select dropdown-font" name="gender" value={client.gender}onChange={(e) => handleClientChange(index, e)}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                {/* <div className="col-md-3">
                  <label className="field_name">Payment Frequency:</label>
                  <select className="form-select dropdown-font" name="payment_frequency" value={client.payment_frequency} onChange={(e) => handleClientChange(index, e)}required>
                    <option value="">Select</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div> */}
                <div className="col-md-2">
                  <label className="field_name">Relationship:</label>
                  <select className="form-select dropdown-font" name="relationship" value={client.relationship} onChange={(e) => handleClientChange(index, e)}required>
                    <option value="">Select</option>
                    <option value="Main Applicant">Main Applicant</option>
                    <option value="Dependent">Dependent</option>
                  </select>
                </div>
                              {/* Add Remove Button here */}
        <div className="button col-md-1 text-center d-flex align-items-center justify-content-center pt-4 ">
            <button type="button" className="btn btn-danger"onClick={() => removeClient(index)} style={{borderRadius: '50%',}}>
              <i className="fas fa-trash-alt"></i>
            </button>
          </div></div></div></div>
        ))}
  
  <h4 className="text-left mt-5">
        {" "}
        <span style={{ color: "Green" }}>April (MyHEALTH)Indonesia</span>
      </h4>
  <div className="col-md-6 mt-4 ">
  <label className="field_name">Area of Coverage:</label>
          <select className="form-control"name="area_of_coverage"value={contactInfo.area_of_coverage}onChange={handleContactInfoChange}>
                     <option value="Worldwide">Worldwide</option>
                      <option value="Worldwide excl USA">Worldwide excl USA</option>
                      <option value="ASEAN Ex. SG">ASEAN Ex. SG</option>
          </select>
  </div>
  <div>
  <h5 className="mt-4 col-md-12">
    Family Discount Percentage: 
     {" "}{getFamilyDiscountPercentage(clients.length)}% &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
     Area of Coverage: {contactInfo.area_of_coverage}
  </h5>
</div>

{response.length > 0 && (
  <div>
      <h4 className="text-left mt-4">        
        <span style={{ color: "Green" }}>Plans</span>
      </h4>

    <table className="table table-bordered table-striped plan">
      <thead>
        <tr>
          <th>Client</th>
          <th colSpan={2}>Hospital & Surgery</th>
          <th colSpan={2}>Outpatient</th>
          <th colSpan={2}>Maternity</th>
          <th colSpan={2}>Dental</th>
          <th>Subtotal</th>
        </tr>

        <tr>
        <th></th>
        <th><div className="d-flex justify-content-between"><span>Plan & Room</span>
        <span>Deductible</span></div></th>
        <th>Premium</th>
        <th><div className="d-flex justify-content-between">
          <span>Plan & Room</span>
        <span>Deductible</span></div></th>
        <th>Premium</th>
        <th>Plan & Room</th>
        <th>Premium</th>
        <th>Plan & Room</th>
        <th>Premium</th>
        <th></th>

        </tr>
      </thead>
      <tbody>
        {response.map((rate, index) => (
          <tr key={index}>
            <td>
              {clients[index].name} ({clients[index].gender},{" "}
              {clients[index].age}) 
              {/* {clients[index].country_of_residence} */}
            </td>
            <td>
              <div className="d-flex gap-2">
                <select className="form-select dropdown-font" value={clients[index].plans.hs} onChange={(e) => handlePlanChange(index, "hs", e.target.value)}>
                  <option value="Elite">Elite</option>
                  <option value="Extensive">Extensive</option>
                  <option value="Essential">Essential</option>
                  <option value="Core">Core</option>
                </select>
                <select className="form-select dropdown-font" value={clients[index].plans.hs_deductible} onChange={(e) => handlePlanChange(index, "hs_deductible", e.target.value)}>
                  <option value="Nil">Nil</option>
                  <option value="US$500">US$500</option>
                  <option value="US$1,000">US$1,000</option>
                  <option value="US$2,500">US$2,500</option>
                </select>
              </div>
              {/* Premium: {rate.hs !== "N/A" ? rate.hs.toLocaleString() : "N/A"} */}
            </td>
            <td>{rate.hs !== "N/A" ? rate.hs.toLocaleString() : "N/A"}</td>
            <td>
              <div className="d-flex gap-2">
                <select className="form-select dropdown-font" value={clients[index].plans.op} onChange={(e) => handlePlanChange(index, "op", e.target.value)}>
                  <option value="N/A">None</option>
                  <option value="Elite">Elite</option>
                  <option value="Extensive">Extensive</option>
                  <option value="Essential">Essential</option>
                  <option value="Core">Core</option>
                </select>
                <select className="form-select dropdown-font" value={clients[index].plans.op_co_ins} onChange={(e) => handlePlanChange(index, "op_co_ins", e.target.value)}>
                  <option value="Nil">Nil</option>
                  <option value="20%">20%</option>
                </select>
              </div>
              {/* Premium: {rate.op !== "N/A" ? rate.op.toLocaleString() : "N/A"} */}
            </td>
            <td>{rate.op !== "N/A" ? rate.op.toLocaleString() : "N/A"}</td>
            <td>
              <select className="form-select dropdown-font" value={clients[index].plans.ma} onChange={(e) => handlePlanChange(index, "ma", e.target.value)}>
                <option value="N/A">None</option>
                <option value="Elite">Elite</option>
                <option value="Extensive">Extensive</option>
                <option value="Essential">Essential</option>
                <option value="Core">Core</option>
              </select>
              {/* Premium: {rate.ma !== "N/A" ? rate.ma.toLocaleString() : "N/A"} */}
            </td>
            <td>{rate.ma !== "N/A" ? rate.ma.toLocaleString() : "N/A"}</td>
            <td>
              <select className="form-select dropdown-font" value={clients[index].plans.dn} onChange={(e) => handlePlanChange(index, "dn", e.target.value)}>
                <option value="N/A">None</option>
                <option value="Elite">Elite</option>
                <option value="Extensive">Extensive</option>
                <option value="Essential">Essential</option>
                <option value="Core">Core</option>
              </select>
              {/* Premium: {rate.dn !== "N/A" ? rate.dn.toLocaleString() : "N/A"} */}
            </td>
            <td>{rate.dn !== "N/A" ? rate.dn.toLocaleString() : "N/A"}</td>
            <td>
              USD{" "}
              {["hs", "op", "ma", "dn"]
                .map((key) =>
                  rate[key] !== undefined && rate[key] !== "N/A" ? rate[key] : 0
                )
                .reduce((sum, premium) => sum + premium, 0).toLocaleString()}
            </td>
          </tr>
        ))}
          <tr>
            <td colSpan="9" className="text-end fw-bold">
              Total Annual Premium:
            </td>
            <td className="fw-bold">
              USD {Number(calculateTotalPremium()).toLocaleString()}
            </td>
          </tr>
      </tbody>
    </table>
  </div>
)}
<div className="text-center mt-4">
  <button type="submit" className="btn btn-success ms-3">
    Get Rates
  </button>
</div>

      </form>
            <p className="text-center mt-5">
              By clicking on Submit Application you agree that your data may be used by Medishure to contact you by<br></br>phone or email your insurance application. Find more information on the processing of your<br></br>data in our <span style={{ color: "Red" }}> Personal Data Policy</span>.
      </p>
      <div className="text-center">
  <button className="btn btn-success ms-3" onClick={handleEmailSubmit}>Submit Application</button>
</div>
    </div>
  );
};
export default InputForm;
