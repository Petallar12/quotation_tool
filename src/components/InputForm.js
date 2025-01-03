import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Tooltip } from 'bootstrap'; // Make sure to import Tooltip
import './inputform.css';
import BtnLoader from "./BtnLoader";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

{/* <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script> */}


const InputForm = () => {
  useEffect(() => {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new Tooltip(tooltipTriggerEl));
  }, []);
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

  const [loadingState, setLoadingState] = useState({
    getRates: false,
    submitApplication: false,
  });
  // Track loading status
  
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
  // limit the number of clients
  const CLIENT_LIMIT = 10;

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
 // Check if contact information is filled
 if (!contactInfo.fullName || !contactInfo.contactNumber || !contactInfo.emailAddress || !contactInfo.nationality) {
  toast.error("Please fill out all contact information fields.");
  return; // Don't proceed if contact info is missing
}

// Check if policy information (clients' details) is filled
const missingPolicyInfo = clients.some((client) => 
  !client.name || !client.age || !client.gender || !client.relationship
);

if (missingPolicyInfo) {
  toast.error("Please fill out all contact information fields.");
  return; // Don't proceed if policy info is missing
}
setLoadingState((prev) => ({ ...prev, getRates: true })); // Start loading for Get Rates

    try {
      const token = "your-api-token";
      const apiUrl ="https://mib-quotetool.com/quoting_api/api/quotations/get_rates";

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
      toast.success("Rates fetched successfully!");

    } catch (error) {
      console.error("Error fetching API:", error.response || error.message);
      toast.error("Failed to fetch data. Please check your input or API requirements.");

    }finally {
      setLoadingState((prev) => ({ ...prev, getRates: false })); // Stop loading
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
      // Check if contact information is filled
  if (!contactInfo.fullName || !contactInfo.contactNumber || !contactInfo.emailAddress || !contactInfo.nationality) {
    toast.error("Please fill out all contact information fields.");
    return; // Don't proceed if contact info is missing
  }

  // Check if policy information (clients' details) is filled
  const missingPolicyInfo = clients.some((client) => 
    !client.name || !client.age || !client.gender || !client.relationship
  );

  if (missingPolicyInfo) {
    toast.error("Please fill out all contact information fields.");

    return; // Don't proceed if policy info is missing
  }
    // Start loading
    setLoadingState((prev) => ({ ...prev, submitApplication: true })); // Start loading for Submit Application
    try {
      const emailPayload = {contactInfo, 
        // email: "calvin@medishure.com", // Your email address to receive the data
        plans: response.map((rate, index) => ({
          client: `${clients[index].name} (${clients[index].gender}, ${clients[index].age})`,
          hospitalSurgeryPlan: clients[index].plans.hs,
          hospitalSurgeryDeductible: clients[index].plans.hs_deductible,
          hospitalSurgery: `Premium: USD ${rate.hs || "N/A"}`,
          outpatientPlan: clients[index].plans.op,
          outpatientDeductible: clients[index].plans.op_co_ins,
          outpatient: `Premium: USD ${rate.op || "N/A"}`,
          maternityPlan: clients[index].plans.ma,
          maternity: `Premium: USD ${rate.ma || "N/A"}`,
          dentalPlan: clients[index].plans.dn,
          dental: `Premium: USD ${rate.dn || "N/A"}`,
          subtotal: `USD ${["hs", "op", "ma", "dn"]
            .map((key) => (rate[key] !== undefined && rate[key] !== "N/A" ? rate[key] : 0))
            .reduce((sum, premium) => sum + premium, 0)
            .toFixed(2)}`,
        })),
        totalPremium: calculateTotalPremium(),
      };
  
      const result = await axios.post(
        "https://quotation-tool-backend.vercel.app/send-email", // Updated to deployed backend URL
        emailPayload
      );
      toast.success("Email successfully sent!");
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email.");
    }finally {
      setLoadingState((prev) => ({ ...prev, submitApplication: false })); // Stop loading
    }
    
  };

  return (

    
    <div className="container my-4">
    <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      <h1 className="text-center mb-2">
        I would like to know more about{" "}
        <span style={{ color: "Green" }}>MY HEALTH</span> Family Discount
      </h1>
      <h5 className="text-center mb-2">My Health can accept applications from people aged 65 years or younger. To find out the best and discounted plan for <br></br>you and your family, you`ll need to provide some information:</h5>
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
      </div>
      <h4 className="text-left mb-4">
        {" "}
        <span style={{ color: "Green" }}>Policy Information</span>
      </h4>
      <form onSubmit={handleSubmit}>
        {/* <div className="d-flex justify-content-end mb-2">
          <button type="button"className="btn btn-primary" onClick={addClient}
                disabled={clients.length >= CLIENT_LIMIT} // Disable button if 10 clients are already added (Limit of 10 clients) 
          >
            <i className="fas fa-user-friends"></i> Add Dependent(s)
          </button>
        </div> */}
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
                <div className="col-md-2">
                  <label className="field_name">Relationship:</label>
                  <select className="form-select dropdown-font" name="relationship" value={client.relationship} onChange={(e) => handleClientChange(index, e)}required>
                    <option value="">Select</option>
                    <option value="Main Applicant">Main Applicant</option>
                    <option value="Dependent">Dependent</option>
                  </select>
                </div>
                 {/* Conditionally render the Add Dependent button only for the first client */}
            {index === 0 && (
                <div className="button col-md-1 text-center d-flex align-items-center justify-content-center pt-4 ">
                    <button title="Add Dependent" type="button" className="btn btn-primary" onClick={addClient}style={{borderRadius: '50%', padding :'8px 10px '}} disabled={clients.length >= CLIENT_LIMIT}>
                    <i class="fa-solid fa-user-plus"></i>
                    </button>
                </div>
            )}
        {/* Add Remove Button here */}
        {/* Conditionally render the trash button only if the client is not the Main Applicant */}
        {client.relationship !== "Main Applicant" && (
        <div className="button col-md-1 text-center d-flex align-items-center justify-content-center pt-4 ">
            <button title="Remove Dependent" type="button" className="btn btn-danger"onClick={() => removeClient(index)} style={{borderRadius: '50%',}}>
              <i className="fas fa-trash-alt"></i>
            </button>
          </div> )}
          </div>
    
    </div></div>
        ))}
  <h4 className="text-left mt-5">
        {" "}
        <span style={{ color: "Green" }}>April (MyHEALTH)Indonesia</span>
      </h4>
  <div className="col-md-3 mt-4 ">
  <label className="field_name">Area of Coverage:</label>
          <select className="form-select dropdown-font"name="area_of_coverage"value={contactInfo.area_of_coverage}onChange={handleContactInfoChange}>
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
    <div className="table-responsive"> 
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
            <td>USD {rate.hs !== "N/A" ? rate.hs.toLocaleString() : "N/A"}</td>
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
            <td>USD {rate.op !== "N/A" ? rate.op.toLocaleString() : "N/A"}</td>
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
            <td>USD {rate.ma !== "N/A" ? rate.ma.toLocaleString() : "N/A"}</td>
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
            <td>USD {rate.dn !== "N/A" ? rate.dn.toLocaleString() : "N/A"}</td>
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
  </div><br/></div>
)}
        <div style={{display: "flex",justifyContent: "center", alignItems: "center", }}>
        <button onClick={handleSubmit} disabled={loadingState.getRates} className="btn btn-success">
            {loadingState.getRates ? <BtnLoader /> : "Get Rates"}
        </button>
        </div>

      </form>
            <p className="text-center mt-4" style={{ fontSize: '12px' }}>
              By clicking on Submit Application you agree that your data may be used by Medishure to contact you by<br></br>phone or email your insurance application. Find more information on the processing of your<br></br> data in our{" "}
  <span style={{ color: "Red", cursor: "pointer" }} data-bs-toggle="modal" data-bs-target="#personalDataPolicyModal">
    Personal Data Policy
  </span>.</p>

      <div style={{display: "flex",justifyContent: "center", alignItems: "center", }}>
        <button onClick={handleEmailSubmit} disabled={loadingState.submitApplication} className="btn btn-success" >
            {loadingState.submitApplication ? <BtnLoader /> : "Submit Application"}
        </button>
      </div>
    {/* Place the modal here */}
    <div
      className="modal fade"
      id="personalDataPolicyModal"
      tabIndex="-1"
      aria-labelledby="personalDataPolicyModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="personalDataPolicyModalLabel">
              Personal Data Policy
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
              <p>
                <b>Personal Data Privacy Policy</b><br/>
                <b>Effective Date:</b> December 15, 2024<br/>
                <b>1. Introduction<br/></b>
                <span style={{ fontSize: '14px' }}>Welcome to our April quote tool. At Luke Medikal International, we respect and value your privacy. This Personal Data Privacy Policy outlines how we collect, use, store, and protect your personal information when you use our quote form available at lukemedikal.co.id.
                By using our quotation form, you consent to the terms of this policy.<br/></span>
                <hr/><br/>
                <b>2. Information We Collect</b><br/>
                <span style={{ fontSize: '14px' }}>When you submit a quote request through our form, we may collect the following personal data:<br/>
                &nbsp;•	Full Name<br/>
                &nbsp;•	Contact Information (e.g., email address, phone number)<br/>
                &nbsp;•	Location Details<br/>
                &nbsp;•	Age & Gender<br/>
                We collect this information solely for the purposes outlined below.<br/></span>
                <hr/><br/>
                <b>3. How We Use Your Information</b><br/>
                <span style={{ fontSize: '14px' }}>We use the personal information collected through the quote form to:<br/>
                &nbsp;&nbsp;•	Provide you with accurate quotes and pricing information.<br/>
                &nbsp;&nbsp;•	Contact you to discuss your requirements or provide further assistance.<br/>
                &nbsp;&nbsp;•	Improve our services and customer experience.<br/>
                &nbsp;&nbsp;•	Maintain internal records for administrative purposes.<br/>
                Your information will not be used for marketing purposes unless you provide explicit consent.<br/></span>
                <hr/><br/>
                <b>4. How We Store and Protect Your Information</b><br/>
                <span style={{ fontSize: '14px' }}>We take appropriate technical and organizational measures to protect your personal data from unauthorized access, use, or disclosure. These include:<br/>
                &nbsp;&nbsp;•	Secure data storage methods.<br/>
                &nbsp;&nbsp;•	Limited access to personal data (only authorized personnel).<br/>
                &nbsp;&nbsp;•	Encryption and security protocols to safeguard information transmitted online.<br/>
                We retain your personal information only as long as necessary to fulfill the purpose for which it was collected or to comply with legal obligations.<br/></span>
                <hr/><br/>
                <b>5. Sharing of Your Information</b><br/>
                <span style={{ fontSize: '14px' }}>We do not sell, rent, or trade your personal information to third parties. Your data may only be shared under the following circumstances:<br/>
                &nbsp;&nbsp;•	With Your Consent: When you explicitly authorize us to share information.<br/>
                &nbsp;&nbsp;•	Legal Requirements: If required by law, regulation, or valid legal process.<br/>
                &nbsp;&nbsp;•	Service Providers: Trusted third parties who assist us in operating the quotation tool (e.g., email or hosting services).<br/></span>
                <hr/><br/>
                <b>6. Your Rights</b><br/>
                <span style={{ fontSize: '14px' }}>Under applicable data protection laws, you have the right to:<br/>
                &nbsp;&nbsp;•	Access the personal information we hold about you.<br/>
                &nbsp;&nbsp;•	Correct any inaccuracies in your information.<br/>
                &nbsp;&nbsp;•	Request deletion of your data where applicable.<br/>
                &nbsp;&nbsp;•	Object to the processing of your data in certain circumstances.<br/>
                To exercise these rights or if you have privacy-related concerns, please contact us at info@lukemedikal.co.id<br/></span>
                <hr/><br/>
                <b>7. Changes to This Policy</b><br/>
                <span style={{ fontSize: '14px' }}>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. The updated version will be posted on this page with the "Effective Date".<br/></span>
                <hr/><br/>
                <b>8. Contact Us</b><br/>
                <span style={{ fontSize: '14px' }}>If you have any questions or concerns about this Privacy Policy or how your data is handled, please contact us:<br/>
                Luke Medikal International<br/>
                <b>Email: info@lukemedikal.co.id<br/>
                Phone: +62 21 22604632<br/>
                Website: https://lukemedikal.co.id</b></span>
              </p>
            </div>

         
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
export default InputForm;
